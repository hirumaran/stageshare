const express = require('express');
const rateLimit = require('express-rate-limit');
const { register, login, refreshToken, logout, me, refreshMatrix, forgotPassword, resetPassword, sendOtp, verifyOtp, oauthLogin } = require('../controllers/auth.controller');
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

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many token refresh attempts, try again later' },
});

// Strict limiter for password reset — prevents token brute-forcing
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Too many password reset attempts, try again later' },
});

// OTP send: IP-keyed ceiling on top of the per-email throttle in the controller.
const otpSendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Too many verification codes requested, try again later' },
});

// OTP verify: strict, to stop code brute-forcing across emails from one IP.
const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many verification attempts, try again later' },
});

router.post('/register', registerLimiter, register);
router.post('/login', loginLimiter, login);
// Email verification OTP (signup) — unauthenticated by design
router.post('/send-otp', otpSendLimiter, sendOtp);
router.post('/verify-otp', otpVerifyLimiter, verifyOtp);
// OAuth sign-in (Google / Microsoft) — verifies a provider id_token, mints Clio tokens
router.post('/oauth', loginLimiter, oauthLogin);
// refresh and logout use the refresh token as auth — no authenticateToken middleware
router.post('/refresh', refreshLimiter, refreshToken);
router.post('/logout', logout);
// password reset — unauthenticated by design
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/reset-password', passwordResetLimiter, resetPassword);
router.get('/me', authenticateToken, me);
router.get('/matrix/refresh', authenticateToken, refreshMatrix);

module.exports = router;
