const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'kebeleUser',
            required: true
        },
        type: {
            type: String,
            enum: ['status_update', 'announcement', 'id_expiry_reminder', 'request_update', 'job_update', 'account_update', 'system'],
            required: true
        },
        title: {
            type: String,
            required: true,
            maxlength: 200
        },
        message: {
            type: String,
            required: true,
            maxlength: 1000
        },
        readStatus: {
            type: Boolean,
            default: false
        },
        // Reference to related entity
        relatedId: {
            type: mongoose.Schema.Types.ObjectId
        },
        relatedType: {
            type: String,
            enum: ['User', 'Request', 'Job', 'DigitalId', 'Household']
        }
    },
    {
        timestamps: true
    }
);

// Indexes
notificationSchema.index({ userId: 1, readStatus: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
