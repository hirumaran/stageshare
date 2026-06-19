const express = require('express');
const authRoutes = require('./auth.routes');
const itemRoutes = require('./item.routes');
const requestRoutes = require('./request.routes');
const schoolRoutes = require('./school.routes');
const adminRoutes = require('./admin.routes');
const notificationRoutes = require('./notification.routes');
const deviceRoutes = require('./device.routes');
const contactRoutes = require('./contact.routes');
const moderationRoutes = require('./moderation.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/auth', deviceRoutes);
router.use('/items', itemRoutes);
router.use('/requests', requestRoutes);
router.use('/schools', schoolRoutes);
router.use('/admin', adminRoutes);
router.use('/notifications', notificationRoutes);
router.use('/contact', contactRoutes);
router.use('/moderation', moderationRoutes);

module.exports = router;
