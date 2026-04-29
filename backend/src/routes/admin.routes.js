const router   = require('express').Router()
const { authenticateToken } = require('../middleware/auth')
const { requireAdmin }      = require('../middleware/admin')
const controller            = require('../controllers/admin.controller')

// Every route: authenticateToken first, requireAdmin second
// authenticateToken verifies the JWT and populates req.user
// requireAdmin then checks req.user.role === 'admin'
const guard = [authenticateToken, requireAdmin]

router.get  ('/dashboard',           ...guard, controller.getDashboardStats)
router.get  ('/users',               ...guard, controller.getAllUsers)
router.patch('/users/:id/status',    ...guard, controller.toggleUserStatus)
router.get  ('/requests/overdue',    ...guard, controller.getOverdueRequests)

module.exports = router
