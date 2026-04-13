const express = require('express');
const {
    createRequest,
    getRequests,
    getRequestById,
    updateRequestStatus,
    convertToJob,
    deleteRequest,
    escalateRequest
} = require('../controllers/requestController');
const authMiddleware = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const employeeAuth = require('../middleware/employeeAuth');
const { createRequestValidator } = require('../middleware/validators');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Create request (any authenticated user) with validation
router.post('/', createRequestValidator, createRequest);

// Get all requests (filtered by role)
router.get('/', getRequests);

// Get single request
router.get('/:id', getRequestById);

// Escalate request to admin (employee/special-employee only)
router.post('/:id/escalate', employeeAuth, escalateRequest);

// Update request status (admin/employee only)
router.patch('/:id/status', employeeAuth, updateRequestStatus);

// Convert to job (admin only)
router.post('/:id/convert-to-job', adminAuth, convertToJob);

// Delete request (admin only)
router.delete('/:id', adminAuth, deleteRequest);

module.exports = router;
