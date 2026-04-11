const express = require('express');
const { register, login, checkUser, updateUserStatus, changePassword, requestPasswordReset, resetPassword } = require('../controllers/authController.js');
const authMiddleware = require('../middleware/auth.js');
const adminAuth = require('../middleware/adminAuth.js');
const { authLimiter, registerLimiter } = require('../middleware/rateLimiter.js');
const { registerValidator, loginValidator, changePasswordValidator, forgotPasswordValidator, resetPasswordValidator } = require('../middleware/validators');

const router = express.Router();

// Public routes (with rate limiting + validation)
router.post('/register', registerLimiter, registerValidator, register);
router.post('/login', authLimiter, loginValidator, login);
router.post('/forgot-password', authLimiter, forgotPasswordValidator, requestPasswordReset);
router.post('/reset-password', authLimiter, resetPasswordValidator, resetPassword);

// Protected routes
router.get('/me', authMiddleware, checkUser);
router.get('/checkUser', authMiddleware, checkUser);
router.get('/checkUser/:id', authMiddleware, checkUser);

// Change password (authenticated users only)
router.put('/change-password', authMiddleware, changePassword);

// Admin only - update user status
router.patch('/users/:id/status', authMiddleware, adminAuth, updateUserStatus);

module.exports = router;