const { pool } = require('../config/db')

async function getAllUsers(req, res) {
  try {
    const schoolId = req.query.school_id ? parseInt(req.query.school_id) : null
    if (req.query.school_id && isNaN(schoolId)) {
      return res.status(400).json({ error: 'Invalid school ID' })
    }

    const { rows } = await pool.query(
      `SELECT
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.role,
        u.is_active,
        u.avatar_url,
        u.matrix_user_id,
        u.last_login,
        u.created_at,
        s.id   AS school_id,
        s.name AS school_name,
        s.slug AS school_slug,
        COUNT(DISTINCT i.id)  FILTER (WHERE i.is_active = TRUE)         AS items_listed,
        COUNT(DISTINCT br.id) FILTER (WHERE br.status = 'active')       AS active_borrows,
        COUNT(DISTINCT br.id) FILTER (WHERE br.status = 'pending')      AS pending_requests
      FROM users u
      JOIN schools s ON u.school_id = s.id
      LEFT JOIN items i ON i.added_by = u.id
      LEFT JOIN borrow_requests br ON br.requester_id = u.id
      WHERE ($1::int IS NULL OR u.school_id = $1)
      GROUP BY u.id, s.id, s.name, s.slug
      ORDER BY s.name ASC, u.last_name ASC, u.first_name ASC`,
      [schoolId]
    )

    res.status(200).json(rows.map(row => ({
      ...row,
      items_listed: parseInt(row.items_listed),
      active_borrows: parseInt(row.active_borrows),
      pending_requests: parseInt(row.pending_requests)
    })))
  } catch (err) {
    console.error('[admin.controller.getAllUsers]', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

async function toggleUserStatus(req, res) {
  try {
    const targetUserId = parseInt(req.params.id, 10)
    if (isNaN(targetUserId)) {
      return res.status(400).json({ error: 'Invalid user ID' })
    }

    const { is_active } = req.body
    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ error: 'is_active must be a boolean' })
    }

    if (targetUserId === req.user.userId && is_active === false) {
      return res.status(400).json({
        error: 'You cannot deactivate your own account'
      })
    }

    const { rows: existingRows } = await pool.query(
      'SELECT id, first_name, last_name, is_active FROM users WHERE id = $1',
      [targetUserId]
    )
    if (existingRows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    const { rows } = await pool.query(
      `UPDATE users
       SET is_active = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, first_name, last_name, email, role, is_active, school_id`,
      [is_active, targetUserId]
    )

    res.status(200).json(rows[0])
  } catch (err) {
    console.error('[admin.controller.toggleUserStatus]', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

async function getOverdueRequests(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT
        br.id                                                          AS request_id,
        br.return_date,
        (CURRENT_DATE - br.return_date)                               AS days_overdue,
        br.quantity_requested,
        br.requester_note,
        i.id                                                           AS item_id,
        i.name                                                         AS item_name,
        i.category_id,
        own_s.id                                                       AS owner_school_id,
        own_s.name                                                     AS owner_school_name,
        req_u.id                                                       AS requester_id,
        req_u.first_name                                               AS requester_first_name,
        req_u.last_name                                                AS requester_last_name,
        req_u.email                                                    AS requester_email,
        req_u.matrix_user_id                                           AS requester_matrix_id,
        req_s.id                                                       AS requester_school_id,
        req_s.name                                                     AS requester_school_name
      FROM borrow_requests br
      JOIN items      i     ON br.item_id              = i.id
      JOIN schools    own_s ON br.owner_school_id      = own_s.id
      JOIN users      req_u ON br.requester_id         = req_u.id
      JOIN schools    req_s ON br.requester_school_id  = req_s.id
      WHERE br.status     = 'active'
        AND br.return_date < CURRENT_DATE
      ORDER BY (CURRENT_DATE - br.return_date) DESC`
    )

    const summary = {
      total_overdue:       rows.length,
      total_days_overdue:  rows.reduce((sum, r) => sum + parseInt(r.days_overdue), 0),
      schools_affected:    [...new Set(rows.map(r => r.requester_school_id))].length,
    }

    res.status(200).json({
      summary,
      overdue: rows.map(row => ({
        ...row,
        days_overdue: parseInt(row.days_overdue)
      }))
    })
  } catch (err) {
    console.error('[admin.controller.getOverdueRequests]', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

async function getDashboardStats(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT
        COUNT(DISTINCT u.id) FILTER (WHERE u.is_active = TRUE)                    AS active_teachers,
        COUNT(DISTINCT u.id) FILTER (WHERE u.is_active = FALSE)                   AS inactive_teachers,
        COUNT(DISTINCT i.id) FILTER (WHERE i.is_active = TRUE)                    AS total_items,
        COUNT(DISTINCT i.id) FILTER (WHERE i.is_active = TRUE
                                       AND i.quantity_available = 0)               AS fully_borrowed,
        COUNT(DISTINCT br.id) FILTER (WHERE br.status = 'pending')                AS pending_requests,
        COUNT(DISTINCT br.id) FILTER (WHERE br.status = 'approved')               AS approved_requests,
        COUNT(DISTINCT br.id) FILTER (WHERE br.status = 'active')                 AS active_borrows,
        COUNT(DISTINCT br.id) FILTER (WHERE br.status = 'active'
                                        AND br.return_date < CURRENT_DATE)         AS overdue_borrows,
        COUNT(DISTINCT br.id) FILTER (WHERE br.status = 'returned')               AS completed_borrows
      FROM users u
      FULL OUTER JOIN items           i  ON TRUE
      FULL OUTER JOIN borrow_requests br ON TRUE`
    )

    const stats = rows[0]
    Object.keys(stats).forEach(key => {
      stats[key] = parseInt(stats[key]) || 0
    })

    res.status(200).json(stats)
  } catch (err) {
    console.error('[admin.controller.getDashboardStats]', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

module.exports = {
  getAllUsers,
  toggleUserStatus,
  getOverdueRequests,
  getDashboardStats
}
