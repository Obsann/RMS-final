const express = require('express');
const { register, login, checkUser, updateUserStatus, changePassword, requestPasswordReset, resetPassword, googleCallback, sendOtp, verifyOtp } = require('../controllers/authController.js');
const authMiddleware = require('../middleware/auth.js');
const adminAuth = require('../middleware/adminAuth.js');
const { authLimiter, registerLimiter } = require('../middleware/rateLimiter.js');
const { registerValidator, loginValidator, changePasswordValidator, forgotPasswordValidator, resetPasswordValidator } = require('../middleware/validators');
const passport = require('passport');

const router = express.Router();

// Public routes (with rate limiting + validation)
router.post('/send-otp', authLimiter, sendOtp);
router.post('/verify-otp', authLimiter, verifyOtp);
router.post('/register', registerLimiter, registerValidator, register);
router.post('/login', authLimiter, loginValidator, login);
router.post('/forgot-password', authLimiter, forgotPasswordValidator, requestPasswordReset);
router.post('/reset-password', authLimiter, resetPasswordValidator, resetPassword);

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=auth_failed' }),
  googleCallback
);

// Protected routes
router.get('/me', authMiddleware, checkUser);
router.get('/checkUser', authMiddleware, checkUser);
router.get('/checkUser/:id', authMiddleware, checkUser);

// Change password (authenticated users only)
router.put('/change-password', authMiddleware, changePassword);

// Admin only - update user status
router.patch('/users/:id/status', authMiddleware, adminAuth, updateUserStatus);

module.exports = router;