const router = require('express').Router()
const { authenticateToken } = require('../middleware/auth')
const { requireAdmin } = require('../middleware/admin')
const controller = require('../controllers/moderation.controller')

// All trust & safety routes require authentication.
router.use(authenticateToken)

// Blocks — self-service for any authenticated user.
router.get    ('/blocks',          controller.listBlocks)
router.post   ('/blocks',          controller.blockUser)
router.delete ('/blocks/:userId',  controller.unblockUser)

// Reports — any user may file; the queue and enforcement are admin-only.
router.post   ('/reports',         controller.createReport)
router.get    ('/reports',         requireAdmin, controller.listReports)
router.patch  ('/reports/:id',     requireAdmin, controller.actionReport)

module.exports = router
