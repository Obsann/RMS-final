const express = require('express');
const {
    generateDigitalId,
    getAllDigitalIds,
    getDigitalIdByUser,
    approveDigitalId,
    revokeDigitalId,
    verifyDigitalId,
    getDigitalIdStats,
    updateDigitalId,
    updateDigitalIdStatus
} = require('../controllers/digitalIdController');
const authMiddleware = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const staffAuth = require('../middleware/staffAuth');
const upload = require('../utils/uploadMiddleware');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get statistics (admin only)
router.get('/stats', adminAuth, getDigitalIdStats);

// Generate digital ID (user for self, admin for any)
router.post('/generate', upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'birthCertificate', maxCount: 1 }
]), generateDigitalId);

// Get all digital IDs (admin only)
router.get('/', adminAuth, getAllDigitalIds);

// Verify by QR code (any employee/admin)
router.post('/verify', verifyDigitalId);

// Get digital ID by user
router.get('/user/:userId', getDigitalIdByUser);

// Get own digital ID
router.get('/me', (req, res, next) => {
    req.params.userId = req.user.id;
    next();
}, getDigitalIdByUser);

// Approve digital ID (admin/staff)
router.post('/:id/approve', staffAuth, approveDigitalId);

// Revoke digital ID (admin/staff)
router.post('/:id/revoke', staffAuth, revokeDigitalId);

// Update digital ID (admin/special-employee)
router.put('/:id', staffAuth, updateDigitalId);

// Update status (e.g. verified by employee)
router.put('/:id/status', staffAuth, updateDigitalIdStatus);

module.exports = router;
