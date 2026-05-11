const path = require('path');
const logger = require('../config/logger');
const DigitalId = require('../models/DigitalId');
const User = require('../models/authmodel');
const { checkLiveness } = require('../utils/livenessCheck');

const DIGITAL_ID_ACTIVE_STATUSES = ['approved', 'issued'];
const DIGITAL_ID_REVIEW_STATUSES = ['pending', 'verified', 'processing'];
const DIGITAL_ID_DIRECT_ISSUE_ROLES = ['employee'];

function buildDigitalIdListQuery(req) {
    const queryParts = [];

    if (req.query.status) {
        queryParts.push({ status: req.query.status });
    }

    if (req.user.role === 'employee') {
        queryParts.push({
            $or: [
                { status: 'pending' },
                { approvedBy: req.user.id },
                { revokedBy: req.user.id }
            ]
        });
    }

    return queryParts.length > 0 ? { $and: queryParts } : {};
}

/**
 * Generate a brand-new digital ID application for a user.
 */
const generateDigitalId = async (req, res) => {
    try {
        const body = req.body || {};
        const { userId } = body;

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
        if (body.name) demographicUpdates.name = body.name;
        if (body.dateOfBirth) demographicUpdates.dateOfBirth = body.dateOfBirth;
        if (body.sex) demographicUpdates.sex = body.sex;
        if (body.nationality) demographicUpdates.nationality = body.nationality;
        if (body.address) demographicUpdates.address = body.address;
        if (body.phone) demographicUpdates.phone = body.phone;

        if (req.files) {
            if (req.files.photo && req.files.photo[0]) {
                demographicUpdates.profilePhoto = `/uploads/${req.files.photo[0].filename}`;
            }
            if (req.files.birthCertificate && req.files.birthCertificate[0]) {
                demographicUpdates.birthCertificate = `/uploads/${req.files.birthCertificate[0].filename}`;
            }
        }

        // ── Liveness check on the uploaded passport photo ──
        let livenessResult = { isLive: true, score: null, raw: { skipped: true } };

        if (req.files && req.files.photo && req.files.photo[0]) {
            const photoPath = req.files.photo[0].path;
            logger.info(`Running liveness check on: ${photoPath}`);
            livenessResult = await checkLiveness(photoPath);

            if (!livenessResult.isLive && !livenessResult.raw?.apiUnavailable) {
                // Photo failed liveness — reject the request
                return res.status(400).json({
                    error: 'Liveness Check Failed',
                    message: 'The uploaded photo did not pass the liveness verification. Please upload a clear, real photograph of yourself (not a printout, screenshot, or photo of a photo).',
                    livenessScore: livenessResult.score
                });
            }

            // If API was unavailable, log a warning but allow submission for manual review
            if (livenessResult.raw?.apiUnavailable) {
                logger.warn(`Liveness API unavailable for user ${targetUserId} — flagging for manual review`);
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

        // Generate a Foundational Identity Number (FIN)
        const finYear = new Date().getFullYear();
        const finRandom = Math.floor(1000 + Math.random() * 9000);
        const idNumber = `FIN-HMJC-${finYear}-${finRandom}`;

        // Create the digital ID record
        digitalId = await DigitalId.create({
            user: targetUserId,
            qrCode,
            idNumber,
            status: 'pending',
            livenessCheck: {
                passed: livenessResult.isLive,
                score: livenessResult.score,
                checkedAt: new Date(),
                apiUnavailable: livenessResult.raw?.apiUnavailable || false
            }
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
 * Get digital ID queue with role-scoped visibility.
 */
const getAllDigitalIds = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const query = buildDigitalIdListQuery(req);

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [digitalIds, total] = await Promise.all([
            DigitalId.find(query)
                .populate('user', 'username email unit phone profilePhoto birthCertificate dateOfBirth sex nationality address')
                .populate('assignedTo', 'username email')
                .populate('approvedBy', 'username email role')
                .populate('revokedBy', 'username email role')
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
            .populate('user', 'username email unit phone sex nationality address dateOfBirth profilePhoto');

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
 * Approve and issue digital ID (employee/admin)
 */
const approveDigitalId = async (req, res) => {
    try {
        const { id } = req.params;

        const digitalId = await DigitalId.findById(id);
        if (!digitalId) {
            return res.status(404).json({ error: 'Not Found', message: 'Digital ID not found' });
        }

        if (DIGITAL_ID_ACTIVE_STATUSES.includes(digitalId.status)) {
            return res.status(400).json({ error: 'Bad Request', message: 'Already approved' });
        }

        if (digitalId.status === 'revoked' || digitalId.status === 'expired') {
            return res.status(400).json({
                error: 'Bad Request',
                message: `Cannot approve a ${digitalId.status} Digital ID`
            });
        }

        // Set expiry to 10 years from now (Proclamation 1284/2023)
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 10);

        const wasAlreadyVerified = digitalId.verifications.some(
            (entry) => entry.verifiedBy?.toString() === req.user.id && entry.method === 'manual'
        );

        if (!wasAlreadyVerified) {
            digitalId.verifications.push({
                verifiedBy: req.user.id,
                verifiedAt: new Date(),
                method: 'manual'
            });
        }

        const finalStatus = DIGITAL_ID_DIRECT_ISSUE_ROLES.includes(req.user.role) ? 'issued' : 'approved';

        digitalId.status = finalStatus;
        digitalId.issuedAt = new Date();
        digitalId.expiresAt = expiresAt;
        digitalId.approvedBy = req.user.id;
        digitalId.approvedAt = new Date();
        digitalId.lastVerified = new Date();
        await digitalId.save();

        // Update user's digital ID status
        await User.findByIdAndUpdate(digitalId.user, {
            'digitalId.status': finalStatus,
            'digitalId.issuedAt': digitalId.issuedAt,
            'digitalId.expiresAt': expiresAt,
            'digitalId.lastVerified': digitalId.lastVerified
        });

        const actionLabel = DIGITAL_ID_DIRECT_ISSUE_ROLES.includes(req.user.role)
            ? 'Digital ID verified and issued'
            : 'Digital ID approved';

        res.json({ message: actionLabel, digitalId });
    } catch (error) {
        logger.error('ApproveDigitalId error:', error);
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
};

/**
 * Reject/Revoke digital ID (employee/admin)
 */
const revokeDigitalId = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const digitalId = await DigitalId.findById(id);
        if (!digitalId) {
            return res.status(404).json({ error: 'Not Found', message: 'Digital ID not found' });
        }

        if (digitalId.status === 'revoked') {
            return res.status(400).json({ error: 'Bad Request', message: 'Digital ID is already revoked' });
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

        if (!DIGITAL_ID_ACTIVE_STATUSES.includes(digitalId.status)) {
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
        const [total, pending, verified, approved, processing, issued, expired, revoked] = await Promise.all([
            DigitalId.countDocuments(),
            DigitalId.countDocuments({ status: 'pending' }),
            DigitalId.countDocuments({ status: 'verified' }),
            DigitalId.countDocuments({ status: 'approved' }),
            DigitalId.countDocuments({ status: 'processing' }),
            DigitalId.countDocuments({ status: 'issued' }),
            DigitalId.countDocuments({ status: 'expired' }),
            DigitalId.countDocuments({ status: 'revoked' })
        ]);

        res.json({
            total,
            byStatus: { pending, verified, approved, processing, issued, expired, revoked }
        });
    } catch (error) {
        logger.error('GetDigitalIdStats error:', error);
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
};

/**
 * Update Digital ID (admin only)
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
 * Update Digital ID status (e.g. manual verification checkpoint)
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

        if (DIGITAL_ID_REVIEW_STATUSES.includes(status) || DIGITAL_ID_ACTIVE_STATUSES.includes(status) || status === 'revoked') {
            await User.findByIdAndUpdate(digitalId.user._id || digitalId.user, {
                'digitalId.status': status,
                ...(status === 'verified' ? { 'digitalId.lastVerified': digitalId.lastVerified } : {})
            });
        }

        res.json({ message: 'Digital ID status updated', digitalId });
    } catch (error) {
        logger.error('UpdateDigitalIdStatus error:', error);
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
};

/**
 * PUBLIC — Verify Digital ID by idNumber (called when QR code is scanned)
 * No authentication required
 */
const verifyByIdNumber = async (req, res) => {
    try {
        const { idNumber } = req.params;
        const digitalId = await DigitalId.findOne({ idNumber })
            .populate('user', 'username profilePhoto');

        if (!digitalId) {
            return res.status(404).json({
                status: 'NOT_FOUND',
                message: 'No Digital ID found with this number'
            });
        }

        const now = new Date();
        const isExpired = digitalId.expiresAt && digitalId.expiresAt < now;
        const isRevoked = digitalId.status === 'revoked' || (digitalId.user && digitalId.user.isDeleted);
        const isIssued = digitalId.status === 'issued';

        const verificationStatus = isRevoked ? 'REVOKED' : isExpired ? 'EXPIRED' : isIssued ? 'VALID' : 'PENDING';

        // Return only safe, public-facing fields
        res.json({
            status: verificationStatus,
            idNumber: digitalId.idNumber,
            fullName: [
                digitalId.firstName,
                digitalId.fatherName,
                digitalId.grandfatherName
            ].filter(Boolean).join(' ') || digitalId.user?.username || 'Unknown',
            fullNameAmharic: [
                digitalId.firstNameAmharic,
                digitalId.fatherNameAmharic,
                digitalId.grandfatherNameAmharic
            ].filter(Boolean).join(' ') || '',
            gender: digitalId.gender || '-',
            nationality: digitalId.nationality || 'Ethiopian',
            issuedAt: digitalId.issuedAt,
            expiresAt: digitalId.expiresAt,
            issuingAuthority: digitalId.issuingAuthority || 'Hermata Merkato Kebele',
            revokeReason: isRevoked ? digitalId.revokeReason : undefined
        });
    } catch (error) {
        logger.error('VerifyByIdNumber error:', error);
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
    updateDigitalIdStatus,
    verifyByIdNumber
};
