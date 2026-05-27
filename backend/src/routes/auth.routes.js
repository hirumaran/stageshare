const express = require('express');
const rateLimit = require('express-rate-limit');
const { register, login, me } = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts, try again later' },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Too many accounts created from this IP' },
});

router.post('/register', registerLimiter, register);
router.post('/login', loginLimiter, login);
router.get('/me', authenticateToken, me);

module.exports = router;
