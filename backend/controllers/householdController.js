const logger = require('../config/logger');
const Household = require('../models/Household');
const User = require('../models/authmodel');

/**
 * Create a new household (admin only)
 */
const createHousehold = async (req, res) => {
    try {
        const { houseNo, headOfHousehold, members, address, type, notes } = req.body;

        if (!houseNo || !headOfHousehold) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'House number and head of household are required'
            });
        }

        // Verify head of household exists
        const head = await User.findById(headOfHousehold);
        if (!head) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Head of household user not found'
            });
        }

        // Check for duplicate house number
        const existing = await Household.findOne({ houseNo });
        if (existing) {
            return res.status(409).json({
                error: 'Conflict',
                message: 'A household with this house number already exists'
            });
        }

        const household = await Household.create({
            houseNo,
            headOfHousehold,
            members: members || [headOfHousehold],
            address,
            type: type || 'residential',
            notes
        });

        res.status(201).json({
            message: 'Household created successfully',
            household
        });
    } catch (error) {
        logger.error('CreateHousehold error:', error);
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
};

/**
 * Get all households (admin only)
 */
const getHouseholds = async (req, res) => {
    try {
        const { status, search, page = 1, limit = 20 } = req.query;

        const query = {};
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { houseNo: { $regex: search, $options: 'i' } },
                { 'address.streetAddress': { $regex: search, $options: 'i' } },
                { 'address.kebele': { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [households, total] = await Promise.all([
            Household.find(query)
                .populate('headOfHousehold', 'username email phone')
                .populate('members', 'username email phone')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Household.countDocuments(query)
        ]);

        res.json({
            households,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        logger.error('GetHouseholds error:', error);
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
};

/**
 * Get household by ID
 */
const getHouseholdById = async (req, res) => {
    try {
        const { id } = req.params;

        const household = await Household.findById(id)
            .populate('headOfHousehold', 'username email phone unit')
            .populate('members', 'username email phone unit');

        if (!household) {
            return res.status(404).json({ error: 'Not Found', message: 'Household not found' });
        }

        // Non-admin users can only view their own household
        if (req.user.role !== 'admin') {
            const isMember = household.members.some(m => m._id.toString() === req.user.id);
            const isHead = household.headOfHousehold._id.toString() === req.user.id;
            if (!isMember && !isHead) {
                return res.status(403).json({ error: 'Forbidden', message: 'Access denied' });
            }
        }

        res.json(household);
    } catch (error) {
        logger.error('GetHouseholdById error:', error);
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
};

/**
 * Update household (admin only)
 */
const updateHousehold = async (req, res) => {
    try {
        const { id } = req.params;
        const { houseNo, headOfHousehold, address, type, status, notes } = req.body;

        const updates = {};
        if (houseNo) updates.houseNo = houseNo;
        if (headOfHousehold) updates.headOfHousehold = headOfHousehold;
        if (address) updates.address = address;
        if (type) updates.type = type;
        if (status) updates.status = status;
        if (notes !== undefined) updates.notes = notes;

        const household = await Household.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true
        })
            .populate('headOfHousehold', 'username email')
            .populate('members', 'username email');

        if (!household) {
            return res.status(404).json({ error: 'Not Found', message: 'Household not found' });
        }

        res.json({ message: 'Household updated', household });
    } catch (error) {
        logger.error('UpdateHousehold error:', error);
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
};

/**
 * Add member to household (admin only)
 */
const addMember = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'User ID is required'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Not Found', message: 'User not found' });
        }

        const household = await Household.findById(id);
        if (!household) {
            return res.status(404).json({ error: 'Not Found', message: 'Household not found' });
        }

        if (household.members.includes(userId)) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'User is already a member of this household'
            });
        }

        household.members.push(userId);
        await household.save();

        const populated = await Household.findById(id)
            .populate('headOfHousehold', 'username email')
            .populate('members', 'username email');

        res.json({ message: 'Member added to household', household: populated });
    } catch (error) {
        logger.error('AddMember error:', error);
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
};

/**
 * Remove member from household (admin only)
 */
const removeMember = async (req, res) => {
    try {
        const { id, userId } = req.params;

        const household = await Household.findById(id);
        if (!household) {
            return res.status(404).json({ error: 'Not Found', message: 'Household not found' });
        }

        if (household.headOfHousehold.toString() === userId) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Cannot remove the head of household. Transfer leadership first.'
            });
        }

        const memberIndex = household.members.findIndex(m => m.toString() === userId);
        if (memberIndex === -1) {
            return res.status(404).json({ error: 'Not Found', message: 'User is not a member of this household' });
        }

        household.members.splice(memberIndex, 1);
        await household.save();

        res.json({ message: 'Member removed from household' });
    } catch (error) {
        logger.error('RemoveMember error:', error);
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
};

/**
 * Delete household (admin only)
 */
const deleteHousehold = async (req, res) => {
    try {
        const { id } = req.params;

        const household = await Household.findByIdAndDelete(id);
        if (!household) {
            return res.status(404).json({ error: 'Not Found', message: 'Household not found' });
        }

        res.json({ message: 'Household deleted successfully' });
    } catch (error) {
        logger.error('DeleteHousehold error:', error);
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
};

module.exports = {
    createHousehold,
    getHouseholds,
    getHouseholdById,
    updateHousehold,
    addMember,
    removeMember,
    deleteHousehold
};
