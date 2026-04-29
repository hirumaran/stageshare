const router = require('express').Router()
const { authenticateToken } = require('../middleware/auth')
const controller = require('../controllers/request.controller')

// ALL routes protected — no public access to borrow request data
router.use(authenticateToken)

router.post   ('/',              controller.createRequest)
router.get    ('/incoming',      controller.getIncomingRequests)
router.get    ('/outgoing',      controller.getOutgoingRequests)
router.get    ('/:id',           controller.getRequestById)
router.patch  ('/:id/approve',   controller.approveRequest)
router.patch  ('/:id/reject',    controller.rejectRequest)
router.patch  ('/:id/cancel',    controller.cancelRequest)
router.patch  ('/:id/pickup',    controller.pickupItem)
router.patch  ('/:id/return',    controller.returnItem)

module.exports = router
