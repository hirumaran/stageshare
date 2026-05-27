const { pool } = require('../config/db')

/**
 * GET /api/v1/schools
 * Public — list all schools with item counts for dropdowns and filters.
 */
async function getSchools(req, res) {
  try {
    const result = await pool.query(
      `SELECT
        s.id,
        s.name,
        s.slug,
        s.address,
        s.logo_url,
        s.contact_email,
        s.created_at,
        COUNT(i.id) FILTER (WHERE i.is_active = TRUE)::int AS item_count
      FROM schools s
      LEFT JOIN items i ON i.school_id = s.id
      WHERE s.is_active = TRUE
      GROUP BY s.id
      ORDER BY s.name ASC`
    )
    res.status(200).json(result.rows)
  } catch (err) {
    console.error('[SchoolController.getSchools]', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * GET /api/v1/schools/:slug
 * Public — single school profile with stats.
 */
async function getSchoolBySlug(req, res) {
  try {
    const { slug } = req.params
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return res.status(400).json({ error: 'Invalid school identifier' })
    }

    const result = await pool.query(
      `SELECT
        s.id,
        s.name,
        s.slug,
        s.address,
        s.logo_url,
        s.contact_email,
        s.created_at,
        COUNT(DISTINCT i.id)  FILTER (WHERE i.is_active = TRUE)::int              AS item_count,
        COUNT(DISTINCT u.id)  FILTER (WHERE u.is_active = TRUE)::int              AS teacher_count,
        COUNT(DISTINCT br.id) FILTER (WHERE br.status = 'active')::int              AS active_borrows_count
      FROM schools s
      LEFT JOIN items           i  ON i.school_id      = s.id
      LEFT JOIN users           u  ON u.school_id      = s.id
      LEFT JOIN borrow_requests br ON br.owner_school_id = s.id
      WHERE s.slug = $1 AND s.is_active = TRUE
      GROUP BY s.id`,
      [slug]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'School not found' })
    }

    res.status(200).json(result.rows[0])
  } catch (err) {
    console.error('[SchoolController.getSchoolBySlug]', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * GET /api/v1/schools/:id/users
 * Protected — teachers at a given school.
 */
async function getUsersBySchool(req, res) {
  try {
    const schoolId = parseInt(req.params.id, 10)
    if (Number.isNaN(schoolId)) {
      return res.status(400).json({ error: 'Invalid school ID' })
    }

    if (req.user.schoolId !== schoolId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only view users from your own school' })
    }

    const schoolCheck = await pool.query(
      'SELECT id FROM schools WHERE id = $1',
      [schoolId]
    )
    if (schoolCheck.rows.length === 0) {
      return res.status(404).json({ error: 'School not found' })
    }

    const result = await pool.query(
      `SELECT
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.role,
        u.avatar_url,
        u.matrix_user_id,
        u.last_login,
        u.created_at,
        s.name AS school_name,
        s.slug AS school_slug
      FROM users u
      JOIN schools s ON u.school_id = s.id
      WHERE u.school_id = $1
        AND u.is_active = TRUE
      ORDER BY u.last_name ASC, u.first_name ASC`,
      [schoolId]
    )

    res.status(200).json(result.rows)
  } catch (err) {
    console.error('[SchoolController.getUsersBySchool]', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * GET /api/v1/schools/:id/stats
 * Protected — aggregate stats for a single school.
 */
async function getSchoolStats(req, res) {
  try {
    const schoolId = parseInt(req.params.id, 10)
    if (Number.isNaN(schoolId)) {
      return res.status(400).json({ error: 'Invalid school ID' })
    }

    if (req.user.schoolId !== schoolId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only view stats from your own school' })
    }

    const result = await pool.query(
      `SELECT
        s.id,
        s.name,

        COUNT(DISTINCT i.id) FILTER (WHERE i.is_active = TRUE)::int                     AS total_items,
        COUNT(DISTINCT i.id) FILTER (WHERE i.is_active = TRUE AND i.quantity_available > 0)::int AS available_items,
        COUNT(DISTINCT i.id) FILTER (WHERE i.is_active = TRUE AND i.quantity_available = 0)::int AS fully_borrowed_items,

        COUNT(DISTINCT br.id) FILTER (WHERE br.status = 'pending')::int                  AS pending_requests,
        COUNT(DISTINCT br.id) FILTER (WHERE br.status = 'active')::int                     AS active_borrows,
        COUNT(DISTINCT br.id) FILTER (WHERE br.status = 'returned')::int                   AS completed_borrows,
        COUNT(DISTINCT br.id) FILTER (WHERE br.status = 'overdue')::int                   AS overdue_borrows,

        COUNT(DISTINCT u.id) FILTER (WHERE u.is_active = TRUE)::int                       AS teacher_count

      FROM schools s
      LEFT JOIN items           i  ON i.school_id        = s.id
      LEFT JOIN borrow_requests br ON br.owner_school_id  = s.id
      LEFT JOIN users           u  ON u.school_id         = s.id
      WHERE s.id = $1
      GROUP BY s.id, s.name`,
      [schoolId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'School not found' })
    }

    res.status(200).json(result.rows[0])
  } catch (err) {
    console.error('[SchoolController.getSchoolStats]', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * GET /api/v1/schools/stats/network
 * Protected — admin-only network overview.
 */
async function getAllSchoolsStats(req, res) {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' })
    }

    const result = await pool.query(
      `SELECT
        s.id,
        s.name,
        s.slug,
        COUNT(DISTINCT i.id)  FILTER (WHERE i.is_active = TRUE)::int              AS total_items,
        COUNT(DISTINCT br.id) FILTER (WHERE br.status = 'active')::int             AS active_borrows,
        COUNT(DISTINCT br.id) FILTER (WHERE br.status = 'pending')::int          AS pending_requests,
        COUNT(DISTINCT br.id) FILTER (WHERE br.status = 'overdue')::int           AS overdue_borrows,
        COUNT(DISTINCT u.id)  FILTER (WHERE u.is_active = TRUE)::int               AS teacher_count
      FROM schools s
      LEFT JOIN items           i  ON i.school_id        = s.id
      LEFT JOIN borrow_requests br ON br.owner_school_id  = s.id
      LEFT JOIN users           u  ON u.school_id         = s.id
      WHERE s.is_active = TRUE
      GROUP BY s.id, s.name, s.slug
      ORDER BY s.name ASC`
    )

    const rows = result.rows
    const totals = {
      total_items:       rows.reduce((sum, s) => sum + parseInt(s.total_items, 10), 0),
      active_borrows:    rows.reduce((sum, s) => sum + parseInt(s.active_borrows, 10), 0),
      pending_requests:  rows.reduce((sum, s) => sum + parseInt(s.pending_requests, 10), 0),
      overdue_borrows:   rows.reduce((sum, s) => sum + parseInt(s.overdue_borrows, 10), 0),
      teacher_count:     rows.reduce((sum, s) => sum + parseInt(s.teacher_count, 10), 0),
    }

    res.status(200).json({ schools: rows, totals })
  } catch (err) {
    console.error('[SchoolController.getAllSchoolsStats]', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

module.exports = {
  getSchools,
  getSchoolBySlug,
  getUsersBySchool,
  getSchoolStats,
  getAllSchoolsStats,
}
