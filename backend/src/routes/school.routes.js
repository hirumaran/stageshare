const router = require('express').Router()
const { authenticateToken } = require('../middleware/auth')
const controller = require('../controllers/school.controller')

// ── Public routes ───────────────────────────────────────────────
router.get('/', controller.getSchools)

// ── Protected static routes (MUST be before /:slug) ───────────
router.get('/stats/network', authenticateToken, controller.getAllSchoolsStats)

// ── Protected parametric routes ─────────────────────────────────
router.get('/:id/users',  authenticateToken, controller.getUsersBySchool)
router.get('/:id/stats',  authenticateToken, controller.getSchoolStats)

// ── Public parametric route (MUST be last among GETs) ───────────
router.get('/:slug', controller.getSchoolBySlug)

module.exports = router
