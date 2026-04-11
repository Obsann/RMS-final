const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ['maintenance', 'complaint', 'certificate', 'id_renewal', 'address_confirmation', 'property_transfer', 'business_license', 'general_inquiry'],
            required: [true, 'Request type is required']
        },
        resident: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'kebeleUser',
            required: true
        },
        unit: {
            type: String,
            required: [true, 'Unit number is required']
        },
        category: {
            type: String,
            required: [true, 'Category is required']
        },
        subject: {
            type: String,
            required: [true, 'Subject is required'],
            maxlength: [200, 'Subject cannot exceed 200 characters']
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            maxlength: [2000, 'Description cannot exceed 2000 characters']
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'urgent'],
            default: 'medium'
        },
        status: {
            type: String,
            enum: ['pending', 'in-progress', 'completed', 'cancelled'],
            default: 'pending'
        },
        // Attachments
        attachments: [{
            filename: String,
            originalName: String,
            uploadedAt: { type: Date, default: Date.now }
        }],
        // Response/Resolution
        response: {
            message: String,
            respondedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'kebeleUser'
            },
            respondedAt: Date
        },
        // If converted to a job
        job: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Job'
        },
        // Timestamps
        resolvedAt: Date
    },
    {
        timestamps: true
    }
);

// Indexes
requestSchema.index({ resident: 1, status: 1 });
requestSchema.index({ type: 1, status: 1 });
requestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Request', requestSchema);
