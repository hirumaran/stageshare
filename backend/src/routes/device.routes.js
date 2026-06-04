const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { registerDeviceToken, removeDeviceToken } = require('../controllers/device.controller');

router.use(authenticateToken);
router.post('/device-token', registerDeviceToken);
router.delete('/device-token', removeDeviceToken);

module.exports = router;
