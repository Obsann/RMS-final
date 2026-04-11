const express = require('express');
const {
    createHousehold,
    getHouseholds,
    getHouseholdById,
    updateHousehold,
    addMember,
    removeMember,
    deleteHousehold
} = require('../controllers/householdController');
const authMiddleware = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get household by ID (members can view their own)
router.get('/:id', getHouseholdById);

// Admin-only routes
router.get('/', adminAuth, getHouseholds);
router.post('/', adminAuth, createHousehold);
router.put('/:id', adminAuth, updateHousehold);
router.delete('/:id', adminAuth, deleteHousehold);

// Member management (admin only)
router.post('/:id/members', adminAuth, addMember);
router.delete('/:id/members/:userId', adminAuth, removeMember);

module.exports = router;
