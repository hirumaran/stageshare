const { pool } = require('../config/db')

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
    const result = await pool.query(
      `SELECT
        br.*,
        i.name          AS item_name,
        i.category_id,
        ii.url          AS item_image_url,
        u.first_name    AS requester_first_name,
        u.last_name     AS requester_last_name,
        u.email         AS requester_email,
        s.name          AS requester_school_name
      FROM borrow_requests br
      JOIN items         i  ON br.item_id       = i.id
      LEFT JOIN item_images ii ON ii.item_id   = i.id AND ii.is_primary = TRUE
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
        br.created_at DESC`,
      [req.user.schoolId]
    )
    res.status(200).json(result.rows)
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
    const result = await pool.query(
      `SELECT
        br.*,
        i.name          AS item_name,
        i.category_id,
        ii.url          AS item_image_url,
        os.name         AS owner_school_name,
        u.first_name    AS owner_first_name,
        u.last_name     AS owner_last_name,
        u.matrix_user_id AS owner_matrix_user_id
      FROM borrow_requests br
      JOIN items       i  ON br.item_id         = i.id
      LEFT JOIN item_images ii ON ii.item_id   = i.id AND ii.is_primary = TRUE
      JOIN schools     os ON br.owner_school_id = os.id
      JOIN users       u  ON i.added_by         = u.id
      WHERE br.requester_id = $1
      ORDER BY br.created_at DESC`,
      [req.user.userId]
    )
    res.status(200).json(result.rows)
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
        error: 'Only the item owner can approve requests',
      })
    }

    if (request.status !== 'pending') {
      return res.status(409).json({
        error: 'Only pending requests can be approved',
      })
    }

    const ownerNote = req.body.ownerNote || null

    const updated = await pool.query(
      `UPDATE borrow_requests
       SET status = 'approved', approved_at = NOW(), owner_note = $2
       WHERE id = $1
       RETURNING *`,
      [requestId, ownerNote]
    )

    res.status(200).json(updated.rows[0])
  } catch (err) {
    console.error('[approveRequest] Error:', err)
    res.status(500).json({ error: 'Internal server error' })
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

    const updated = await pool.query(
      `UPDATE borrow_requests
       SET status = 'rejected', owner_note = $2
       WHERE id = $1
       RETURNING *`,
      [requestId, req.body.ownerNote]
    )

    res.status(200).json(updated.rows[0])
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

    const updated = await pool.query(
      `UPDATE borrow_requests
       SET status = 'cancelled'
       WHERE id = $1
       RETURNING *`,
      [requestId]
    )

    res.status(200).json(updated.rows[0])
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
        ii.url        AS item_image_url,
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
      LEFT JOIN item_images ii ON ii.item_id           = i.id AND ii.is_primary = TRUE
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
}
