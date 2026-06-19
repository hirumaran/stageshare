const router = require('express').Router()
const { authenticateToken } = require('../middleware/auth')
const { idempotency } = require('../middleware/idempotency')
const controller = require('../controllers/request.controller')

// ALL routes protected — no public access to borrow request data
router.use(authenticateToken)

// idempotency guards the non-idempotent mutations: a double-tap / retried Idempotency-Key
// replays the stored response instead of duplicating writes (no-op when the header is absent).
router.post   ('/',              idempotency, controller.createRequest)
router.get    ('/incoming',      controller.getIncomingRequests)
router.get    ('/outgoing',      controller.getOutgoingRequests)
router.get    ('/:id',           controller.getRequestById)
router.patch  ('/:id/approve',   idempotency, controller.approveRequest)
router.patch  ('/:id/reject',    idempotency, controller.rejectRequest)
router.patch  ('/:id/cancel',    idempotency, controller.cancelRequest)
router.patch  ('/:id/pickup',    idempotency, controller.pickupItem)
router.patch  ('/:id/return',    idempotency, controller.returnItem)
router.patch  ('/:id/room',      controller.setRequestRoom)
router.post   ('/:id/room/retry', controller.retryRoomSetup)

module.exports = router
