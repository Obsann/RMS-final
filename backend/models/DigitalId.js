const mongoose = require('mongoose');

const digitalIdSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'kebeleUser',
            required: true,
            unique: true
        },
        qrCode: {
            type: String,
            required: true,
            unique: true
        },
        status: {
            type: String,
            enum: ['pending', 'verified', 'approved', 'processing', 'issued', 'expired', 'revoked'],
            default: 'pending'
        },
        issuedAt: Date,
        expiresAt: Date,
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'kebeleUser'
        },
        issueDate: Date,
        idNumber: String,
        // Verification history
        verifications: [{
            verifiedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'kebeleUser'
            },
            verifiedAt: { type: Date, default: Date.now },
            location: String,
            method: {
                type: String,
                enum: ['qr_scan', 'manual'],
                default: 'qr_scan'
            }
        }],
        lastVerified: Date,
        // Approval
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'kebeleUser'
        },
        approvedAt: Date,
        // Revocation
        revokedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'kebeleUser'
        },
        revokedAt: Date,
        revokeReason: String
    },
    {
        timestamps: true
    }
);

// Indexes
digitalIdSchema.index({ qrCode: 1 });
digitalIdSchema.index({ user: 1 });
digitalIdSchema.index({ status: 1 });

// Generate unique QR code
digitalIdSchema.statics.generateQRCode = function (userId, unit) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `QR-${unit || 'NA'}-${random}-${timestamp}`.toUpperCase();
};

module.exports = mongoose.model('DigitalId', digitalIdSchema);
