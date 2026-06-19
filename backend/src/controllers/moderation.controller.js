const { pool } = require('../config/db')
const { redactRoomEvent, shutdownRoom } = require('../utils/matrix')

/**
 * Trust & safety controller — user blocks + reports (Workstream C2) and the
 * moderation enforcement actions (Workstream C4).
 *
 * Blocks are member-facing and self-service. Reports are member-facing on
 * create, but the queue and enforcement actions are admin-only (gated by
 * requireAdmin in the route layer).
 */

const REPORT_CATEGORIES = new Set([
  'harassment',
  'inappropriate_content',
  'spam',
  'safety_concern',
  'other',
])

// -------------------------------------------------------------------------- //
// Blocks (C2)                                                                //
// -------------------------------------------------------------------------- //

/** POST /api/v1/moderation/blocks  { blockedUserId, reason? } */
async function blockUser(req, res) {
  try {
    const blockerId = req.user.userId
    const blockedId = parseInt(req.body.blockedUserId, 10)
    if (Number.isNaN(blockedId)) {
      return res.status(400).json({ error: 'blockedUserId is required' })
    }
    if (blockedId === blockerId) {
      return res.status(400).json({ error: 'You cannot block yourself' })
    }

    const target = await pool.query('SELECT id FROM users WHERE id = $1', [blockedId])
    if (target.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    const reason = typeof req.body.reason === 'string' ? req.body.reason : null
    const result = await pool.query(
      `INSERT INTO user_blocks (blocker_id, blocked_id, reason)
       VALUES ($1, $2, $3)
       ON CONFLICT (blocker_id, blocked_id) DO UPDATE SET reason = EXCLUDED.reason
       RETURNING id, blocked_id, created_at`,
      [blockerId, blockedId, reason]
    )

    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error('[moderation.blockUser]', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

/** DELETE /api/v1/moderation/blocks/:userId */
async function unblockUser(req, res) {
  try {
    const blockerId = req.user.userId
    const blockedId = parseInt(req.params.userId, 10)
    if (Number.isNaN(blockedId)) {
      return res.status(400).json({ error: 'Invalid user id' })
    }

    await pool.query(
      'DELETE FROM user_blocks WHERE blocker_id = $1 AND blocked_id = $2',
      [blockerId, blockedId]
    )
    res.status(204).end()
  } catch (err) {
    console.error('[moderation.unblockUser]', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

/** GET /api/v1/moderation/blocks — the caller's own block list */
async function listBlocks(req, res) {
  try {
    const result = await pool.query(
      `SELECT b.id, b.blocked_id, b.reason, b.created_at,
              u.first_name, u.last_name
       FROM user_blocks b
       JOIN users u ON b.blocked_id = u.id
       WHERE b.blocker_id = $1
       ORDER BY b.created_at DESC`,
      [req.user.userId]
    )
    res.status(200).json(result.rows)
  } catch (err) {
    console.error('[moderation.listBlocks]', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// -------------------------------------------------------------------------- //
// Reports (C2)                                                               //
// -------------------------------------------------------------------------- //

/**
 * POST /api/v1/moderation/reports
 * { reportedUserId?, requestId?, roomId?, messageEventId?, category, reason?, evidenceText? }
 */
async function createReport(req, res) {
  try {
    const { reportedUserId, requestId, roomId, messageEventId, category, reason, evidenceText } = req.body

    if (!category || !REPORT_CATEGORIES.has(category)) {
      return res.status(400).json({
        error: `category is required and must be one of: ${[...REPORT_CATEGORIES].join(', ')}`,
      })
    }
    if (!reportedUserId && !roomId && !requestId) {
      return res.status(400).json({
        error: 'A report must reference a user, a request, or a room',
      })
    }

    const result = await pool.query(
      `INSERT INTO reports
         (reporter_id, reported_user_id, request_id, room_id, message_event_id,
          category, reason, evidence_text)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, status, created_at`,
      [
        req.user.userId,
        reportedUserId ? parseInt(reportedUserId, 10) : null,
        requestId ? parseInt(requestId, 10) : null,
        roomId || null,
        messageEventId || null,
        category,
        typeof reason === 'string' ? reason : null,
        typeof evidenceText === 'string' ? evidenceText : null,
      ]
    )

    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error('[moderation.createReport]', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

/** GET /api/v1/moderation/reports?status=open — admin moderation queue */
async function listReports(req, res) {
  try {
    const status = req.query.status
    const params = []
    let where = ''
    if (status) {
      params.push(status)
      where = 'WHERE r.status = $1'
    }

    const result = await pool.query(
      `SELECT r.*,
              reporter.first_name AS reporter_first_name,
              reporter.last_name  AS reporter_last_name,
              reported.first_name AS reported_first_name,
              reported.last_name  AS reported_last_name
       FROM reports r
       JOIN users reporter ON r.reporter_id = reporter.id
       LEFT JOIN users reported ON r.reported_user_id = reported.id
       ${where}
       ORDER BY r.created_at DESC
       LIMIT 200`,
      params
    )
    res.status(200).json(result.rows)
  } catch (err) {
    console.error('[moderation.listReports]', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * Resolves the Matrix user id of the item owner for a report's room, so a
 * redaction can be issued by an authoritative room member. Tries the report's
 * request_id first, then falls back to the borrow_request that owns the room id.
 */
async function resolveRoomOwnerMatrixId({ requestId, roomId }) {
  if (requestId) {
    const { rows } = await pool.query(
      `SELECT owner.matrix_user_id
       FROM borrow_requests br
       JOIN items i ON br.item_id = i.id
       JOIN users owner ON i.added_by = owner.id
       WHERE br.id = $1`,
      [requestId]
    )
    if (rows[0]?.matrix_user_id) return rows[0].matrix_user_id
  }
  if (roomId) {
    const { rows } = await pool.query(
      `SELECT owner.matrix_user_id
       FROM borrow_requests br
       JOIN items i ON br.item_id = i.id
       JOIN users owner ON i.added_by = owner.id
       WHERE br.matrix_room_id = $1
       LIMIT 1`,
      [roomId]
    )
    if (rows[0]?.matrix_user_id) return rows[0].matrix_user_id
  }
  return null
}

/**
 * PATCH /api/v1/moderation/reports/:id  { action }  — admin only.
 * action: 'dismiss' | 'redact_message' | 'shutdown_room'
 * Enforcement (C4) leans on the server-side Matrix actor and the dropped-E2EE
 * decision so reported content can actually be redacted / taken down.
 */
async function actionReport(req, res) {
  try {
    const reportId = parseInt(req.params.id, 10)
    if (Number.isNaN(reportId)) {
      return res.status(400).json({ error: 'Invalid report id' })
    }
    const action = req.body.action
    const VALID = new Set(['dismiss', 'redact_message', 'shutdown_room'])
    if (!VALID.has(action)) {
      return res.status(400).json({ error: `action must be one of: ${[...VALID].join(', ')}` })
    }

    const { rows } = await pool.query('SELECT * FROM reports WHERE id = $1', [reportId])
    const report = rows[0]
    if (!report) {
      return res.status(404).json({ error: 'Report not found' })
    }

    let newStatus = 'reviewing'
    if (action === 'dismiss') {
      newStatus = 'dismissed'
    } else if (action === 'redact_message') {
      if (!report.room_id || !report.message_event_id) {
        return res.status(400).json({ error: 'Report has no room_id/message_event_id to redact' })
      }
      const actorMatrixUserId = await resolveRoomOwnerMatrixId({
        requestId: report.request_id,
        roomId: report.room_id,
      })
      if (!actorMatrixUserId) {
        return res.status(409).json({ error: 'Could not resolve a room member to perform the redaction' })
      }
      await redactRoomEvent({
        roomId: report.room_id,
        eventId: report.message_event_id,
        actorMatrixUserId,
        reason: 'Removed by Clio moderation',
      })
      newStatus = 'actioned'
    } else if (action === 'shutdown_room') {
      if (!report.room_id) {
        return res.status(400).json({ error: 'Report has no room_id to shut down' })
      }
      await shutdownRoom(report.room_id, { reason: 'Removed by Clio moderation' })
      newStatus = 'actioned'
    }

    const updated = await pool.query(
      `UPDATE reports
       SET status = $1, action_taken = $2, reviewed_by = $3, reviewed_at = NOW()
       WHERE id = $4
       RETURNING id, status, action_taken, reviewed_at`,
      [newStatus, action, req.user.userId, reportId]
    )

    res.status(200).json(updated.rows[0])
  } catch (err) {
    console.error('[moderation.actionReport]', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

module.exports = {
  blockUser,
  unblockUser,
  listBlocks,
  createReport,
  listReports,
  actionReport,
}
