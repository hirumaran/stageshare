const { pool } = require('../config/db')

async function getNotifications(req, res) {
  try {
    const unreadOnly = req.query.unread_only === 'true' ? true : null

    const { rows } = await pool.query(
      `SELECT
        id,
        type,
        title,
        body,
        link,
        is_read,
        created_at
      FROM notifications
      WHERE user_id = $1
        AND ($2::boolean IS NULL OR is_read = NOT $2)
      ORDER BY created_at DESC
      LIMIT 50`,
      [req.user.userId, unreadOnly]
    )

    const unreadCount = rows.filter(n => !n.is_read).length
    res.status(200).json({ notifications: rows, unread_count: unreadCount })
  } catch (err) {
    console.error('[notification.controller.getNotifications]', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

async function markAsRead(req, res) {
  try {
    const notifId = parseInt(req.params.id, 10)
    if (isNaN(notifId)) {
      return res.status(400).json({ error: 'Invalid notification ID' })
    }

    const { rows, rowCount } = await pool.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE id = $1 AND user_id = $2
       RETURNING id, is_read`,
      [notifId, req.user.userId]
    )

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Notification not found' })
    }

    res.json(rows[0])
  } catch (err) {
    console.error('[notification.controller.markAsRead]', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

async function markAllAsRead(req, res) {
  try {
    const { rowCount } = await pool.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE user_id = $1 AND is_read = FALSE`,
      [req.user.userId]
    )

    res.json({ marked_read: rowCount })
  } catch (err) {
    console.error('[notification.controller.markAllAsRead]', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

async function deleteNotification(req, res) {
  try {
    const notifId = parseInt(req.params.id, 10)
    if (isNaN(notifId)) {
      return res.status(400).json({ error: 'Invalid notification ID' })
    }

    const { rowCount } = await pool.query(
      `DELETE FROM notifications
       WHERE id = $1 AND user_id = $2`,
      [notifId, req.user.userId]
    )

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Notification not found' })
    }

    res.status(204).send()
  } catch (err) {
    console.error('[notification.controller.deleteNotification]', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * Internal helper — called by other controllers, not exposed as a route.
 *
 * Usage:
 *   const { createNotification } = require('./notification.controller')
 *   await createNotification(pool, {
 *     userId: ownerId,
 *     type: 'borrow_request',
 *     title: 'New Borrow Request',
 *     body: `${requesterName} wants to borrow "${itemName}"`,
 *     link: `/requests/${requestId}`
 *   })
 */
async function createNotification(pool, { userId, type, title, body, link }) {
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, body, link)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, type, title, body, link ?? null]
    )
  } catch (err) {
    console.error('[createNotification] Failed to insert notification:', err.message)
  }
}

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
}
