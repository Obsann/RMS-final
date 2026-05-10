const express = require('express');
const {
    createRequest,
    getRequests,
    getRequestById,
    updateRequestStatus,
    convertToJob,
    deleteRequest,
    softDeleteRequest,
    escalateRequest,
    getRequestStats
} = require('../controllers/requestController');
const authMiddleware = require('../middleware/auth');
const { auditReadMiddleware } = require('../middleware/auditMiddleware');
const adminAuth = require('../middleware/adminAuth');
const employeeAuth = require('../middleware/employeeAuth');
const { createRequestValidator } = require('../middleware/validators');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Create request (any authenticated user) with validation
router.post('/', createRequestValidator, createRequest);

// Get request statistics (admin only)
router.get('/stats', adminAuth, getRequestStats);

// Get all requests (filtered by role)
router.get('/', getRequests);

// Get single request (with audit logging for sensitive data reads)
router.get('/:id', auditReadMiddleware('SENSITIVE_DATA_READ', 'Request'), getRequestById);

// Escalate request to admin (employee only)
router.post('/:id/escalate', employeeAuth, escalateRequest);

// Update request status (admin/employee only)
router.patch('/:id/status', employeeAuth, updateRequestStatus);

// Convert to job (admin only)
router.post('/:id/convert-to-job', adminAuth, convertToJob);

// Delete request (admin only) - Hard delete
router.delete('/:id', adminAuth, deleteRequest);

// Soft delete request (Admin or Resident)
router.delete('/:id/soft', softDeleteRequest);

module.exports = router;

