const logger = require('../config/logger');
const DigitalId = require('../models/DigitalId');
const User = require('../models/authmodel');

/**
 * Generate digital ID for a user
 */
const generateDigitalId = async (req, res) => {
    try {
        const { userId } = req.body;

        // Authorization check: Only admin can generate ID for others
        if (userId && userId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Admin access required to generate IDs for others'
            });
        }

        const targetUserId = userId || req.user.id;

        // Check if user exists
        const user = await User.findById(targetUserId);
        if (!user) {
            return res.status(404).json({ error: 'Not Found', message: 'User not found' });
        }

        // Check if digital ID already exists
        let digitalId = await DigitalId.findOne({ user: targetUserId });

        if (digitalId) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Digital ID already exists for this user'
            });
        }

        // Generate QR code
        const qrCode = DigitalId.generateQRCode(targetUserId, user.unit);

        // Build demographic updates object
        const demographicUpdates = {};
        if (req.body.name) demographicUpdates.name = req.body.name;
        if (req.body.dateOfBirth) demographicUpdates.dateOfBirth = req.body.dateOfBirth;
        if (req.body.sex) demographicUpdates.sex = req.body.sex;
        if (req.body.nationality) demographicUpdates.nationality = req.body.nationality;
        if (req.body.address) demographicUpdates.address = req.body.address;
        if (req.body.phone) demographicUpdates.phone = req.body.phone;

        if (req.files) {
            if (req.files.photo && req.files.photo[0]) {
                demographicUpdates.profilePhoto = `/uploads/${req.files.photo[0].filename}`;
            }
            if (req.files.birthCertificate && req.files.birthCertificate[0]) {
                demographicUpdates.birthCertificate = `/uploads/${req.files.birthCertificate[0].filename}`;
            }
        }

        // Use findByIdAndUpdate to persist demographics WITHOUT triggering
        // the password pre-save hook (which would re-hash an already-hashed password)
        if (Object.keys(demographicUpdates).length > 0) {
            await User.findByIdAndUpdate(
                targetUserId,
                { $set: demographicUpdates },
                { runValidators: false }
            );
        }

        // Create the digital ID record
        digitalId = await DigitalId.create({
            user: targetUserId,
            qrCode,
            status: 'pending'
        });

        // Update only the digitalId sub-doc on the user (safe — no password changes)
        await User.findByIdAndUpdate(
            targetUserId,
            { $set: { 'digitalId.qrCode': qrCode, 'digitalId.status': 'pending' } },
            { runValidators: false }
        );

        res.status(201).json({
            message: 'Digital ID generated',
            digitalId
        });
    } catch (error) {
        logger.error('GenerateDigitalId error:', error);
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
};

/**
 * Get all digital IDs (admin)
 */
const getAllDigitalIds = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;

        const query = {};
        if (status) query.status = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [digitalIds, total] = await Promise.all([
            DigitalId.find(query)
                .populate('user', 'username email unit phone profilePhoto birthCertificate dateOfBirth sex nationality address')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            DigitalId.countDocuments(query)
        ]);

        res.json({
            digitalIds,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        logger.error('GetAllDigitalIds error:', error);
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
};

/**
 * Get digital ID by user
 */
const getDigitalIdByUser = async (req, res) => {
    try {
        const userId = req.params.userId || req.user.id;

        // Authorization check
        if (req.user.role !== 'admin' && req.user.id !== userId) {
            return res.status(403).json({ error: 'Forbidden', message: 'Access denied' });
        }

        const digitalId = await DigitalId.findOne({ user: userId })
            .populate('user', 'username email unit phone');

        if (!digitalId) {
            return res.status(404).json({ error: 'Not Found', message: 'Digital ID not found' });
        }

        res.json(digitalId);
    } catch (error) {
        logger.error('GetDigitalIdByUser error:', error);
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
};

/**
 * Approve digital ID (admin)
 */
const approveDigitalId = async (req, res) => {
    try {
        const { id } = req.params;

        const digitalId = await DigitalId.findById(id);
        if (!digitalId) {
            return res.status(404).json({ error: 'Not Found', message: 'Digital ID not found' });
        }

        if (digitalId.status === 'approved') {
            return res.status(400).json({ error: 'Bad Request', message: 'Already approved' });
        }

        // Set expiry to 1 year from now
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);

        digitalId.status = 'approved';
        digitalId.issuedAt = new Date();
        digitalId.expiresAt = expiresAt;
        digitalId.approvedBy = req.user.id;
        digitalId.approvedAt = new Date();
        await digitalId.save();

        // Update user's digital ID status
        await User.findByIdAndUpdate(digitalId.user, {
            'digitalId.status': 'approved',
            'digitalId.issuedAt': digitalId.issuedAt,
            'digitalId.expiresAt': expiresAt
        });

        res.json({ message: 'Digital ID approved', digitalId });
    } catch (error) {
        logger.error('ApproveDigitalId error:', error);
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
};

/**
 * Reject/Revoke digital ID (admin)
 */
const revokeDigitalId = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const digitalId = await DigitalId.findById(id);
        if (!digitalId) {
            return res.status(404).json({ error: 'Not Found', message: 'Digital ID not found' });
        }

        digitalId.status = 'revoked';
        digitalId.revokedBy = req.user.id;
        digitalId.revokedAt = new Date();
        digitalId.revokeReason = reason || 'No reason provided';
        await digitalId.save();

        // Update user's digital ID status
        await User.findByIdAndUpdate(digitalId.user, {
            'digitalId.status': 'revoked'
        });

        res.json({ message: 'Digital ID revoked', digitalId });
    } catch (error) {
        logger.error('RevokeDigitalId error:', error);
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
};

/**
 * Verify digital ID by QR code
 */
const verifyDigitalId = async (req, res) => {
    try {
        const { qrCode } = req.body;

        if (!qrCode) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'QR code is required'
            });
        }

        const digitalId = await DigitalId.findOne({ qrCode })
            .populate('user', 'username email unit phone');

        if (!digitalId) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Invalid QR code',
                valid: false
            });
        }

        // Check if expired
        if (digitalId.status === 'expired' ||
            (digitalId.expiresAt && digitalId.expiresAt < new Date())) {
            digitalId.status = 'expired';
            await digitalId.save();
            return res.status(400).json({
                error: 'Expired',
                message: 'Digital ID has expired',
                valid: false
            });
        }

        if (digitalId.status !== 'approved') {
            return res.status(400).json({
                error: 'Invalid',
                message: `Digital ID is ${digitalId.status}`,
                valid: false
            });
        }

        // Log verification
        digitalId.verifications.push({
            verifiedBy: req.user.id,
            verifiedAt: new Date(),
            method: 'qr_scan'
        });
        digitalId.lastVerified = new Date();
        await digitalId.save();

        res.json({
            valid: true,
            message: 'Digital ID verified successfully',
            user: {
                name: digitalId.user.username,
                unit: digitalId.user.unit,
                email: digitalId.user.email
            },
            issuedAt: digitalId.issuedAt,
            expiresAt: digitalId.expiresAt
        });
    } catch (error) {
        logger.error('VerifyDigitalId error:', error);
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
};

/**
 * Get digital ID statistics (admin)
 */
const getDigitalIdStats = async (req, res) => {
    try {
        const [total, pending, approved, expired, revoked] = await Promise.all([
            DigitalId.countDocuments(),
            DigitalId.countDocuments({ status: 'pending' }),
            DigitalId.countDocuments({ status: 'approved' }),
            DigitalId.countDocuments({ status: 'expired' }),
            DigitalId.countDocuments({ status: 'revoked' })
        ]);

        res.json({
            total,
            byStatus: { pending, approved, expired, revoked }
        });
    } catch (error) {
        logger.error('GetDigitalIdStats error:', error);
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
};

/**
 * Update Digital ID (admin/special-employee)
 * Allows assigning to employee or marking as issued.
 */
const updateDigitalId = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, assignedTo, issueDate } = req.body;

        const digitalId = await DigitalId.findById(id).populate('user');
        if (!digitalId) {
            return res.status(404).json({ error: 'Not Found', message: 'Digital ID not found' });
        }

        const updates = {};
        if (status) updates.status = status;
        if (assignedTo) updates.assignedTo = assignedTo;
        if (issueDate) updates.issueDate = issueDate;

        // If marking as issued, safely generate an ID number
        if (status === 'issued' && !digitalId.idNumber) {
            const unit = digitalId.user?.unit || 'GEN';
            const rnd = Math.floor(1000 + Math.random() * 9000);
            updates.idNumber = `RES-${new Date().getFullYear()}-${unit}-${rnd}`;
            updates.issuedAt = new Date();

            // Sync status to user doc
            await User.findByIdAndUpdate(digitalId.user._id, {
                'digitalId.status': 'issued'
            });
        } else if (status === 'approved' && assignedTo) {
            updates.status = 'processing';
        }

        const updated = await DigitalId.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true }
        ).populate('user', 'username email unit phone profilePhoto');

        res.json({ message: 'Digital ID updated', digitalId: updated });
    } catch (error) {
        logger.error('UpdateDigitalId error:', error);
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
};

/**
 * Update Digital ID status (e.g. Employee verifying)
 */
const updateDigitalIdStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const digitalId = await DigitalId.findById(id).populate('user');
        if (!digitalId) {
            return res.status(404).json({ error: 'Not Found', message: 'Digital ID not found' });
        }

        if (status === 'verified') {
            digitalId.verifications.push({
                verifiedBy: req.user.id,
                verifiedAt: new Date(),
                method: 'manual'
            });
            digitalId.lastVerified = new Date();
        }

        digitalId.status = status;
        await digitalId.save();

        res.json({ message: 'Digital ID status updated', digitalId });
    } catch (error) {
        logger.error('UpdateDigitalIdStatus error:', error);
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
};

module.exports = {
    generateDigitalId,
    getAllDigitalIds,
    getDigitalIdByUser,
    approveDigitalId,
    revokeDigitalId,
    verifyDigitalId,
    getDigitalIdStats,
    updateDigitalId,
    updateDigitalIdStatus
};
