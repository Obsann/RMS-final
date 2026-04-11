const express = require('express');
const {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    addDependent,
    removeDependent,
    getUsersByRole
} = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const staffAuth = require('../middleware/staffAuth');
const { suspiciousActivityMiddleware } = require('../middleware/suspiciousActivity');
const upload = require('../utils/uploadMiddleware');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get all users - admin and special-employee
router.get('/', staffAuth, getAllUsers);

// Get users by role - admin and special-employee
router.get('/role/:role', staffAuth, getUsersByRole);

// Get user by ID - users can get their own, admins can get any
router.get('/:id', getUserById);

// Create user - admin and special-employee (triggers suspicious activity alert for sp.employees)
router.post('/', staffAuth, suspiciousActivityMiddleware, createUser);

// Update user - users can update their own, admins can update any
router.put('/:id', upload.single('photo'), updateUser);

// Delete user - admin only (triggers suspicious activity alert for sp.employees)
router.delete('/:id', adminAuth, suspiciousActivityMiddleware, deleteUser);

// Dependent management
router.post('/:id/dependents', addDependent);
router.delete('/:id/dependents/:dependentId', removeDependent);

module.exports = router;
