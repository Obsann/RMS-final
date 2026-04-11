const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
    {
        actorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'kebeleUser',
            required: true
        },
        actorRole: {
            type: String,
            required: true
        },
        action: {
            type: String,
            required: true,
            enum: [
                'USER_REGISTERED',
                'USER_LOGIN',
                'USER_STATUS_UPDATED',
                'USER_UPDATED',
                'USER_DELETED',
                'PASSWORD_CHANGED',
                'REQUEST_CREATED',
                'REQUEST_STATUS_UPDATED',
                'REQUEST_CONVERTED_TO_JOB',
                'REQUEST_DELETED',
                'JOB_CREATED',
                'JOB_ASSIGNED',
                'JOB_UPDATED',
                'JOB_DELETED',
                'DIGITAL_ID_GENERATED',
                'DIGITAL_ID_APPROVED',
                'DIGITAL_ID_REVOKED',
                'DIGITAL_ID_VERIFIED',
                'FILE_UPLOADED',
                'FILE_DELETED',
                'HOUSEHOLD_CREATED',
                'HOUSEHOLD_UPDATED',
                'HOUSEHOLD_DELETED',
                'NOTIFICATION_SENT',
                'PASSWORD_RESET_REQUESTED',
                'PASSWORD_RESET_COMPLETED',
                'DEPENDENT_ADDED',
                'DEPENDENT_REMOVED'
            ]
        },
        targetId: {
            type: mongoose.Schema.Types.ObjectId
        },
        targetType: {
            type: String,
            enum: ['User', 'Request', 'Job', 'DigitalId', 'File', 'Household', 'Notification']
        },
        details: {
            type: String,
            maxlength: 1000
        },
        ipAddress: {
            type: String
        },
        previousValues: {
            type: mongoose.Schema.Types.Mixed
        },
        newValues: {
            type: mongoose.Schema.Types.Mixed
        }
    },
    {
        timestamps: true
    }
);

// Indexes for efficient querying
auditLogSchema.index({ actorId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ targetId: 1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
