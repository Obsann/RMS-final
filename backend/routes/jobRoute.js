const express = require('express');
const {
    createJob,
    getJobs,
    getJobById,
    updateJob,
    assignJob,
    deleteJob,
    getJobStats
} = require('../controllers/jobController');
const authMiddleware = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const employeeAuth = require('../middleware/employeeAuth');
const { createJobValidator } = require('../middleware/validators');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get job statistics (admin only)
router.get('/stats', adminAuth, getJobStats);

// Create job (admin only) with validation
router.post('/', adminAuth, createJobValidator, createJob);

// Get all jobs (filtered by role)
router.get('/', employeeAuth, getJobs);

// Get single job
router.get('/:id', employeeAuth, getJobById);

// Update job
router.put('/:id', employeeAuth, updateJob);

// Assign job to employee (admin only)
router.post('/:id/assign', adminAuth, assignJob);

// Delete job (admin only)
router.delete('/:id', adminAuth, deleteJob);

module.exports = router;
