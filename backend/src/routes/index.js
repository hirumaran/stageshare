const express = require('express');
const authRoutes = require('./auth.routes');
const itemRoutes = require('./item.routes');
const requestRoutes = require('./request.routes');
const schoolRoutes = require('./school.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/items', itemRoutes);
router.use('/requests', requestRoutes);
router.use('/schools', schoolRoutes);

module.exports = router;
