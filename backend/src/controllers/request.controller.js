const { pool } = require('../config/db')
const { createNotification } = require('./notification.controller')
const { roomQueue } = require('../queues')

/**
 * Enqueues server-side creation of the borrow chat room (Workstream A1).
 * Keyed by request id so concurrent enqueues (approve + retry) dedupe to one job
 * and the worker only ever creates one room per request (A3). Best-effort:
 * failures here never block the borrow lifecycle — the job retries on its own
 * and either party can trigger a retry.
 */
function enqueueRoomCreation(requestId) {
  return roomQueue
    .add(
      'create-borrow-room',
      { requestId },
      { jobId: `room-${requestId}` }
    )
    .catch((err) => {
      console.error(`[approveRequest] Failed to enqueue room creation for ${requestId}:`, err.message)
    })
}

/**
 * POST /api/v1/requests
 * Create a new borrow request with overlap detection and school isolation.
 */
async function createRequest(req, res) {
  try {
    const {
      itemId,
      quantityRequested = 1,
      requestedDate,
      returnDate,
      requesterNote,
    } = req.body

    // 1. Validate body
    if (!itemId || !requestedDate || !returnDate) {
      return res.status(400).json({
        error: 'itemId, requestedDate, and returnDate are required',
      })
    }
    if (quantityRequested < 1) {
      return res.status(400).json({
        error: 'quantityRequested must be at least 1',
      })
    }
    if (new Date(returnDate) <= new Date(requestedDate)) {
      return res.status(400).json({
        error: 'returnDate must be strictly after requestedDate',
      })
    }

    // 2. Fetch the item
    const itemResult = await pool.query(
      `SELECT i.*, s.id AS owner_school_id
       FROM items i
       JOIN schools s ON i.school_id = s.id
       WHERE i.id = $1 AND i.is_active = TRUE`,
      [itemId]
    )
    const item = itemResult.rows[0]
    if (!item) {
      return res.status(404).json({
        error: 'Item not found or is no longer available',
      })
    }

    // 3. School isolation check
    if (item.school_id === req.user.schoolId) {
      return res.status(400).json({
        error: 'You cannot borrow items from your own school',
      })
    }

    // 3b. Block check (C2) — a block in EITHER direction between the requester
    // and the item owner prevents a new borrow pairing (and therefore chat).
    if (item.added_by) {
      const blocked = await pool.query(
        `SELECT 1 FROM user_blocks
         WHERE (blocker_id = $1 AND blocked_id = $2)
            OR (blocker_id = $2 AND blocked_id = $1)
         LIMIT 1`,
        [req.user.userId, item.added_by]
      )
      if (blocked.rows.length > 0) {
        return res.status(403).json({
          error: 'A block is in place between you and this item owner',
        })
      }

      // 3c. Adult↔minor safeguarding gate (C3). Clio has no cold-contact DMs —
      // chat only exists after an approved borrow — so gating the *pairing*
      // gates the channel. By default a staff member (adult) and a student
      // (minor) may not form a borrow pairing (and therefore a DM); enable
      // ALLOW_ADULT_MINOR_BORROW only for staff-mediated programs. Inert when
      // either side's type is 'unknown' (roster age data not yet imported) — see
      // the deploy runbook: launch must be staff-only/mediated until roster
      // populates user_type.
      const types = await pool.query(
        `SELECT id, user_type FROM users WHERE id = ANY($1::int[])`,
        [[req.user.userId, item.added_by]]
      )
      const typeById = Object.fromEntries(types.rows.map((r) => [r.id, r.user_type]))
      const requesterType = typeById[req.user.userId]
      const ownerType = typeById[item.added_by]
      const isAdultMinorPair =
        (requesterType === 'staff' && ownerType === 'student') ||
        (requesterType === 'student' && ownerType === 'staff')
      if (isAdultMinorPair && process.env.ALLOW_ADULT_MINOR_BORROW !== 'true') {
        return res.status(403).json({
          error: 'Borrowing between staff and students must be staff-mediated and is currently disabled',
        })
      }
    }

    // 4. Availability check
    if (item.quantity_available < quantityRequested) {
      return res.status(409).json({
        error: `Only ${item.quantity_available} unit(s) available, ${quantityRequested} requested`,
      })
    }

    // 5. Overlap detection
    const overlap = await pool.query(
      `SELECT id FROM borrow_requests
       WHERE item_id = $1
         AND status IN ('approved', 'active')
         AND requested_date <= $3
         AND return_date >= $2
       LIMIT 1`,
      [itemId, requestedDate, returnDate]
    )
    if (overlap.rows.length > 0) {
      return res.status(409).json({
        error: 'Item is already reserved during this date range',
      })
    }

    // 6. Insert the request
    const insert = await pool.query(
      `INSERT INTO borrow_requests (
        requester_id, requester_school_id, item_id, owner_school_id,
        quantity_requested, requested_date, return_date, requester_note, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
      RETURNING *`,
      [
        req.user.userId,
        req.user.schoolId,
        itemId,
        item.owner_school_id,
        quantityRequested,
        requestedDate,
        returnDate,
        requesterNote || null,
      ]
    )

    res.status(201).json(insert.rows[0])

    // Fire-and-forget notification to item owner
    const actor = await pool.query(
      'SELECT first_name, last_name FROM users WHERE id = $1',
      [req.user.userId]
    )
    const actorName = actor.rows.length
      ? `${actor.rows[0].first_name} ${actor.rows[0].last_name}`
      : 'A teacher'
    createNotification(pool, {
      userId: item.added_by,
      type: 'borrow_request',
      title: 'New Borrow Request',
      body: `${actorName} wants to borrow "${item.name}"`,
      link: `clio://requests/${insert.rows[0].id}`,
    })
  } catch (err) {
    console.error('[createRequest] Error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * GET /api/v1/requests/incoming
 * Requests made for items owned by the current user's school.
 */
async function getIncomingRequests(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const countResult = await pool.query(
      'SELECT COUNT(*)::int AS total FROM borrow_requests WHERE owner_school_id = $1',
      [req.user.schoolId]
    );
    const total = countResult.rows[0].total;

    const result = await pool.query(
      `SELECT
        br.*,
        i.name          AS item_name,
        i.category_id,
        ii.image_url    AS item_image_url,
        u.first_name    AS requester_first_name,
        u.last_name     AS requester_last_name,
        u.email         AS requester_email,
        u.matrix_user_id AS requester_matrix_user_id,
        s.name          AS requester_school_name
      FROM borrow_requests br
      JOIN items         i  ON br.item_id       = i.id
      LEFT JOIN item_images ii ON ii.item_id   = i.id AND ii.sort_order = 0
      JOIN users         u  ON br.requester_id  = u.id
      JOIN schools       s  ON br.requester_school_id = s.id
      WHERE br.owner_school_id = $1
      ORDER BY
        CASE br.status
          WHEN 'pending'  THEN 1
          WHEN 'approved' THEN 2
          WHEN 'active'   THEN 3
          ELSE 4
        END,
        br.created_at DESC
      LIMIT $2 OFFSET $3`,
      [req.user.schoolId, limit, offset]
    );

    res.status(200).json({
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('[getIncomingRequests] Error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * GET /api/v1/requests/outgoing
 * Requests submitted by the current user.
 */
async function getOutgoingRequests(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const countResult = await pool.query(
      'SELECT COUNT(*)::int AS total FROM borrow_requests WHERE requester_id = $1',
      [req.user.userId]
    );
    const total = countResult.rows[0].total;

    const result = await pool.query(
      `SELECT
        br.*,
        i.name          AS item_name,
        i.category_id,
        ii.image_url    AS item_image_url,
        os.name         AS owner_school_name,
        u.first_name    AS owner_first_name,
        u.last_name     AS owner_last_name,
        u.matrix_user_id AS owner_matrix_user_id,
        br.matrix_room_id
      FROM borrow_requests br
      JOIN items       i  ON br.item_id         = i.id
      LEFT JOIN item_images ii ON ii.item_id   = i.id AND ii.sort_order = 0
      JOIN schools     os ON br.owner_school_id = os.id
      JOIN users       u  ON i.added_by         = u.id
      WHERE br.requester_id = $1
      ORDER BY br.created_at DESC
      LIMIT $2 OFFSET $3`,
      [req.user.userId, limit, offset]
    );

    res.status(200).json({
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('[getOutgoingRequests] Error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * PATCH /api/v1/requests/:id/approve
 * Item owner approves a pending request.
 */
async function approveRequest(req, res) {
  // Approve inside a txn with FOR UPDATE on the item row + overlap re-check so two pending requests cannot both be approved into a double-booking.
  const requestId = parseInt(req.params.id, 10)
  if (Number.isNaN(requestId)) {
    return res.status(400).json({ error: 'Invalid request ID' })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { rows } = await client.query(
      `SELECT br.*, i.added_by AS item_owner_id, i.name AS item_name
       FROM borrow_requests br
       JOIN items i ON br.item_id = i.id
       WHERE br.id = $1
       FOR UPDATE OF i, br`,
      [requestId]
    )
    const request = rows[0]
    if (!request) {
      throw { status: 404, message: 'Request not found' }
    }

    if (request.item_owner_id !== req.user.userId) {
      throw { status: 403, message: 'Only the item owner can approve requests' }
    }

    if (request.status !== 'pending') {
      throw { status: 409, message: 'Only pending requests can be approved' }
    }

    // Re-check overlap under the item lock so a competing already-approved/active borrow blocks this approval (double-booking guard).
    const overlap = await client.query(
      `SELECT id FROM borrow_requests
       WHERE item_id = $1
         AND id <> $2
         AND status IN ('approved', 'active')
         AND requested_date <= $3
         AND return_date >= $4
       LIMIT 1`,
      [request.item_id, requestId, request.return_date, request.requested_date]
    )
    if (overlap.rows.length > 0) {
      throw { status: 409, message: 'Item is already reserved during this date range' }
    }

    const ownerNote = req.body.ownerNote || null

    const updated = await client.query(
      `UPDATE borrow_requests
       SET status = 'approved', approved_at = NOW(), owner_note = $2
       WHERE id = $1
       RETURNING *`,
      [requestId, ownerNote]
    )

    await client.query('COMMIT')

    res.status(200).json(updated.rows[0])

    const actor = await pool.query(
      'SELECT first_name, last_name FROM users WHERE id = $1',
      [req.user.userId]
    )
    const actorName = actor.rows.length
      ? `${actor.rows[0].first_name} ${actor.rows[0].last_name}`
      : 'The item owner'
    createNotification(pool, {
      userId: request.requester_id,
      type: 'approved',
      title: 'Request Approved',
      body: `${actorName} approved your request for "${request.item_name}"`,
      link: `clio://requests/${requestId}`,
    })

    // Create the chat room server-side (A1) — no dependency on the owner's
    // browser Matrix session; the worker retries on transient failure.
    enqueueRoomCreation(requestId)
  } catch (err) {
    await client.query('ROLLBACK')
    if (err.status) {
      return res.status(err.status).json({ error: err.message })
    }
    // 23P01 = exclusion_violation from the borrow_requests overlap constraint (migration 021): surface as the standard 409 conflict.
    if (err.code === '23P01') {
      return res.status(409).json({ error: 'Item is already reserved during this date range' })
    }
    console.error('[approveRequest] Error:', err)
    res.status(500).json({ error: 'Internal server error' })
  } finally {
    client.release()
  }
}

/**
 * PATCH /api/v1/requests/:id/reject
 * Item owner rejects a pending request.
 */
async function rejectRequest(req, res) {
  try {
    const requestId = parseInt(req.params.id, 10)
    if (Number.isNaN(requestId)) {
      return res.status(400).json({ error: 'Invalid request ID' })
    }

    const { rows } = await pool.query(
      `SELECT br.*, i.added_by AS item_owner_id, i.name AS item_name
       FROM borrow_requests br
       JOIN items i ON br.item_id = i.id
       WHERE br.id = $1`,
      [requestId]
    )
    const request = rows[0]
    if (!request) {
      return res.status(404).json({ error: 'Request not found' })
    }

    if (request.item_owner_id !== req.user.userId) {
      return res.status(403).json({
        error: 'Only the item owner can reject requests',
      })
    }

    if (request.status !== 'pending') {
      return res.status(409).json({
        error: 'Only pending requests can be rejected',
      })
    }

    if (!req.body.ownerNote || req.body.ownerNote.trim() === '') {
      return res.status(400).json({
        error: 'ownerNote is required when rejecting a request',
      })
    }

    // Guard the transition in the UPDATE itself so a racing approve/reject can't double-mutate.
    const updated = await pool.query(
      `UPDATE borrow_requests
       SET status = 'rejected', owner_note = $2
       WHERE id = $1 AND status = 'pending'
       RETURNING *`,
      [requestId, req.body.ownerNote]
    )
    if (updated.rowCount === 0) {
      return res.status(409).json({ error: 'Only pending requests can be rejected' })
    }

    res.status(200).json(updated.rows[0])

    const actor = await pool.query(
      'SELECT first_name, last_name FROM users WHERE id = $1',
      [req.user.userId]
    )
    const actorName = actor.rows.length
      ? `${actor.rows[0].first_name} ${actor.rows[0].last_name}`
      : 'The item owner'
    createNotification(pool, {
      userId: request.requester_id,
      type: 'rejected',
      title: 'Request Rejected',
      body: `${actorName} rejected your request for "${request.item_name}"`,
      link: `clio://requests/${requestId}`,
    })
  } catch (err) {
    console.error('[rejectRequest] Error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * PATCH /api/v1/requests/:id/cancel
 * Requester cancels their pending request.
 */
async function cancelRequest(req, res) {
  try {
    const requestId = parseInt(req.params.id, 10)
    if (Number.isNaN(requestId)) {
      return res.status(400).json({ error: 'Invalid request ID' })
    }

    const { rows } = await pool.query(
      'SELECT * FROM borrow_requests WHERE id = $1',
      [requestId]
    )
    const request = rows[0]
    if (!request) {
      return res.status(404).json({ error: 'Request not found' })
    }

    if (request.requester_id !== req.user.userId) {
      return res.status(403).json({ error: 'Permission denied' })
    }

    if (request.status !== 'pending') {
      return res.status(409).json({
        error: 'Only pending requests can be cancelled',
      })
    }

    // Guard the transition in the UPDATE itself so a racing approve/cancel can't double-mutate.
    const updated = await pool.query(
      `UPDATE borrow_requests
       SET status = 'cancelled'
       WHERE id = $1 AND status = 'pending'
       RETURNING *`,
      [requestId]
    )
    if (updated.rowCount === 0) {
      return res.status(409).json({ error: 'Only pending requests can be cancelled' })
    }

    res.status(200).json(updated.rows[0])

    // Notify item owner
    const itemResult = await pool.query(
      'SELECT added_by, name FROM items WHERE id = $1',
      [request.item_id]
    )
    const actor = await pool.query(
      'SELECT first_name, last_name FROM users WHERE id = $1',
      [req.user.userId]
    )
    const actorName = actor.rows.length
      ? `${actor.rows[0].first_name} ${actor.rows[0].last_name}`
      : 'A teacher'
    if (itemResult.rows.length) {
      createNotification(pool, {
        userId: itemResult.rows[0].added_by,
        type: 'cancelled',
        title: 'Request Cancelled',
        body: `${actorName} cancelled their request for "${itemResult.rows[0].name}"`,
        link: `clio://requests/${requestId}`,
      })
    }
  } catch (err) {
    console.error('[cancelRequest] Error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * PATCH /api/v1/requests/:id/pickup
 * Item owner marks an approved request as picked up (active).
 * Decrements item quantity atomically.
 */
async function pickupItem(req, res) {
  const requestId = parseInt(req.params.id, 10)
  if (Number.isNaN(requestId)) {
    return res.status(400).json({ error: 'Invalid request ID' })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { rows } = await client.query(
      `SELECT br.*, i.added_by AS item_owner_id, i.quantity_available
       FROM borrow_requests br
       JOIN items i ON br.item_id = i.id
       WHERE br.id = $1
       FOR UPDATE`,
      [requestId]
    )
    const request = rows[0]
    if (!request) {
      throw { status: 404, message: 'Request not found' }
    }
    if (request.item_owner_id !== req.user.userId) {
      throw { status: 403, message: 'Permission denied' }
    }
    if (request.status !== 'approved') {
      throw { status: 409, message: 'Only approved requests can be marked as picked up' }
    }

    if (request.quantity_available < request.quantity_requested) {
      throw { status: 409, message: 'Item quantity is no longer available' }
    }

    await client.query(
      `UPDATE items
       SET quantity_available = quantity_available - $1,
           updated_at = NOW()
       WHERE id = $2`,
      [request.quantity_requested, request.item_id]
    )

    const { rows: updated } = await client.query(
      `UPDATE borrow_requests
       SET status = 'active', picked_up_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [requestId]
    )

    await client.query('COMMIT')

    const pickupActor = await pool.query(
      'SELECT first_name, last_name FROM users WHERE id = $1',
      [req.user.userId]
    )
    const pickupActorName = pickupActor.rows.length
      ? `${pickupActor.rows[0].first_name} ${pickupActor.rows[0].last_name}`
      : 'The item owner'
    const pickupItemInfo = await pool.query('SELECT name FROM items WHERE id = $1', [request.item_id])
    createNotification(pool, {
      userId: request.requester_id,
      type: 'picked_up',
      title: 'Item Picked Up',
      body: `${pickupActorName} marked "${pickupItemInfo.rows[0]?.name || 'item'}" as picked up`,
      link: `clio://requests/${requestId}`,
    })

    res.status(200).json(updated[0])
  } catch (err) {
    await client.query('ROLLBACK')
    if (err.status) {
      return res.status(err.status).json({ error: err.message })
    }
    console.error('[pickupItem] Transaction failed:', err)
    res.status(500).json({ error: 'Internal server error' })
  } finally {
    client.release()
  }
}

/**
 * PATCH /api/v1/requests/:id/return
 * Item owner marks an active borrow as returned.
 * Restores item quantity atomically, capped at quantity_total.
 */
async function returnItem(req, res) {
  const requestId = parseInt(req.params.id, 10)
  if (Number.isNaN(requestId)) {
    return res.status(400).json({ error: 'Invalid request ID' })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { rows } = await client.query(
      `SELECT br.*, i.added_by AS item_owner_id
       FROM borrow_requests br
       JOIN items i ON br.item_id = i.id
       WHERE br.id = $1
       FOR UPDATE`,
      [requestId]
    )
    const request = rows[0]
    if (!request) {
      throw { status: 404, message: 'Request not found' }
    }
    if (request.item_owner_id !== req.user.userId) {
      throw { status: 403, message: 'Permission denied' }
    }
    if (request.status !== 'active') {
      throw { status: 409, message: 'Only active borrows can be marked as returned' }
    }

    await client.query(
      `UPDATE items
       SET quantity_available = LEAST(quantity_available + $1, quantity_total),
           updated_at = NOW()
       WHERE id = $2`,
      [request.quantity_requested, request.item_id]
    )

    const { rows: updated } = await client.query(
      `UPDATE borrow_requests
       SET status = 'returned', returned_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [requestId]
    )

    await client.query('COMMIT')

    const returnActor = await pool.query(
      'SELECT first_name, last_name FROM users WHERE id = $1',
      [req.user.userId]
    )
    const returnActorName = returnActor.rows.length
      ? `${returnActor.rows[0].first_name} ${returnActor.rows[0].last_name}`
      : 'The item owner'
    const returnItemInfo = await pool.query('SELECT name FROM items WHERE id = $1', [request.item_id])
    createNotification(pool, {
      userId: request.requester_id,
      type: 'returned',
      title: 'Item Returned',
      body: `${returnActorName} marked "${returnItemInfo.rows[0]?.name || 'item'}" as returned`,
      link: `clio://requests/${requestId}`,
    })

    res.status(200).json(updated[0])
  } catch (err) {
    await client.query('ROLLBACK')
    if (err.status) {
      return res.status(err.status).json({ error: err.message })
    }
    console.error('[returnItem] Transaction failed:', err)
    res.status(500).json({ error: 'Internal server error' })
  } finally {
    client.release()
  }
}

/**
 * GET /api/v1/requests/:id
 * Fetch a single request. Caller must be requester or item owner's school.
 */
async function getRequestById(req, res) {
  try {
    const requestId = parseInt(req.params.id, 10)
    if (Number.isNaN(requestId)) {
      return res.status(400).json({ error: 'Invalid request ID' })
    }

    const { rows } = await pool.query(
      `SELECT
        br.*,
        i.name        AS item_name,
        i.description AS item_description,
        ii.image_url  AS item_image_url,
        req_u.first_name  AS requester_first_name,
        req_u.last_name   AS requester_last_name,
        req_u.email       AS requester_email,
        req_s.name        AS requester_school_name,
        own_s.name        AS owner_school_name,
        own_u.first_name  AS owner_first_name,
        own_u.last_name   AS owner_last_name,
        own_u.matrix_user_id AS owner_matrix_user_id
      FROM borrow_requests br
      JOIN items       i     ON br.item_id             = i.id
      LEFT JOIN item_images ii ON ii.item_id           = i.id AND ii.sort_order = 0
      JOIN users       req_u ON br.requester_id         = req_u.id
      JOIN schools     req_s ON br.requester_school_id  = req_s.id
      JOIN schools     own_s ON br.owner_school_id      = own_s.id
      JOIN users       own_u ON i.added_by              = own_u.id
      WHERE br.id = $1`,
      [requestId]
    )

    const request = rows[0]
    if (!request) {
      return res.status(404).json({ error: 'Request not found' })
    }

    if (
      request.requester_id !== req.user.userId &&
      request.owner_school_id !== req.user.schoolId
    ) {
      return res.status(403).json({ error: 'Permission denied' })
    }

    res.status(200).json(request)
  } catch (err) {
    console.error('[getRequestById] Error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * PATCH /api/v1/requests/:id/room
 * Store the Matrix room ID on a borrow request.
 * Only the item owner may call this — called immediately after approving.
 */
async function setRequestRoom(req, res) {
  try {
    const requestId = parseInt(req.params.id, 10)
    if (Number.isNaN(requestId)) {
      return res.status(400).json({ error: 'Invalid request ID' })
    }

    const { matrixRoomId } = req.body
    if (!matrixRoomId || typeof matrixRoomId !== 'string') {
      return res.status(400).json({ error: 'matrixRoomId is required' })
    }

    // Verify the caller is the item owner
    const { rows } = await pool.query(
      `SELECT br.id, i.added_by AS item_owner_id
       FROM borrow_requests br
       JOIN items i ON br.item_id = i.id
       WHERE br.id = $1`,
      [requestId]
    )
    if (!rows[0]) {
      return res.status(404).json({ error: 'Request not found' })
    }
    if (rows[0].item_owner_id !== req.user.userId) {
      return res.status(403).json({ error: 'Only the item owner can set the room ID' })
    }

    const updated = await pool.query(
      `UPDATE borrow_requests SET matrix_room_id = $1 WHERE id = $2 RETURNING id, matrix_room_id`,
      [matrixRoomId, requestId]
    )

    res.status(200).json(updated.rows[0])
  } catch (err) {
    console.error('[setRequestRoom] Error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * POST /api/v1/requests/:id/room/retry
 * Re-trigger server-side room creation for an approved request whose room
 * setup did not complete (Workstream A2). Available to EITHER party (owner or
 * borrower) — since room creation runs under the server actor, the borrower is
 * no longer dead-ended by the owner-only setRequestRoom path. Idempotent: if a
 * room already exists, returns it; otherwise re-enqueues the (deduped) job.
 */
async function retryRoomSetup(req, res) {
  try {
    const requestId = parseInt(req.params.id, 10)
    if (Number.isNaN(requestId)) {
      return res.status(400).json({ error: 'Invalid request ID' })
    }

    const { rows } = await pool.query(
      `SELECT br.id, br.status, br.matrix_room_id, br.requester_id, i.added_by AS item_owner_id
       FROM borrow_requests br
       JOIN items i ON br.item_id = i.id
       WHERE br.id = $1`,
      [requestId]
    )
    const request = rows[0]
    if (!request) {
      return res.status(404).json({ error: 'Request not found' })
    }

    // Either the borrower or the item owner may retry.
    const isParty =
      request.requester_id === req.user.userId ||
      request.item_owner_id === req.user.userId
    if (!isParty) {
      return res.status(403).json({ error: 'Only the borrower or item owner can retry chat setup' })
    }

    // Chat only exists for active loan states.
    if (!['approved', 'active', 'returned', 'overdue'].includes(request.status)) {
      return res.status(409).json({ error: 'Chat is only available after a request is approved' })
    }

    if (request.matrix_room_id) {
      return res.status(200).json({ id: request.id, matrixRoomId: request.matrix_room_id, status: 'ready' })
    }

    await enqueueRoomCreation(requestId)
    return res.status(202).json({ id: request.id, matrixRoomId: null, status: 'pending' })
  } catch (err) {
    console.error('[retryRoomSetup] Error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

module.exports = {
  createRequest,
  getIncomingRequests,
  getOutgoingRequests,
  getRequestById,
  approveRequest,
  rejectRequest,
  cancelRequest,
  pickupItem,
  returnItem,
  setRequestRoom,
  retryRoomSetup,
}
