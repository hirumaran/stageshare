const router     = require('express').Router()
const { authenticateToken } = require('../middleware/auth')
const controller = require('../controllers/notification.controller')

// ALL routes scoped to authenticated user — no admin required
router.use(authenticateToken)

// IMPORTANT: static routes before parametric routes
router.get   ('/',          controller.getNotifications)
router.patch ('/read-all',  controller.markAllAsRead)    // BEFORE /:id/read
router.patch ('/:id/read',  controller.markAsRead)
router.delete('/:id',       controller.deleteNotification)

module.exports = router
