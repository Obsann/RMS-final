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
    updateDigitalIdStatus,
    verifyByIdNumber
} = require('../controllers/digitalIdController');
const authMiddleware = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const { roleAuth } = require('../middleware/roleAuth');
const upload = require('../utils/uploadMiddleware');

const router = express.Router();
const digitalIdStaffAuth = roleAuth(['admin', 'employee']);
const digitalIdWorkflowAdminAuth = roleAuth(['admin']);

// ── PUBLIC route — no auth (QR code scan verification) ─────────────────────
router.get('/verify/:idNumber', verifyByIdNumber);

// All other routes require authentication
router.use(authMiddleware);

// Get statistics (admin only)
router.get('/stats', adminAuth, getDigitalIdStats);

// Generate digital ID (user for self, admin for any)
router.post('/generate', upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'birthCertificate', maxCount: 1 }
]), generateDigitalId);

// Get all digital IDs (staff visibility is scoped in the controller)
router.get('/', digitalIdStaffAuth, getAllDigitalIds);

// Verify by QR code (staff only)
router.post('/verify', digitalIdStaffAuth, verifyDigitalId);

// Get digital ID by user
router.get('/user/:userId', getDigitalIdByUser);

// Get own digital ID
router.get('/me', (req, res, next) => {
    req.params.userId = req.user.id;
    next();
}, getDigitalIdByUser);

// Approve digital ID (employee/admin)
router.post('/:id/approve', digitalIdStaffAuth, approveDigitalId);

// Revoke digital ID (employee/admin)
router.post('/:id/revoke', digitalIdStaffAuth, revokeDigitalId);

// Update digital ID (admin only)
router.put('/:id', digitalIdWorkflowAdminAuth, updateDigitalId);

// Update status (e.g. verified by employee)
router.put('/:id/status', digitalIdStaffAuth, updateDigitalIdStatus);

module.exports = router;
