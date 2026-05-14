const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ['maintenance', 'complaint', 'certificate', 'id_renewal', 'identity', 'permit', 'address_confirmation', 'property_transfer', 'business_license', 'general_inquiry'],
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
        // Service Hub fields
        serviceType: {
            type: String,
            maxlength: [100, 'Service type cannot exceed 100 characters']
        },
        categoryTag: {
            type: String,
            enum: ['ID_REGISTRATION', 'CERTIFICATES', 'PERMITS', 'FEEDBACK_SUPPORT', null],
            default: null
        },
        formData: {
            type: mongoose.Schema.Types.Mixed,
            default: null
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
            enum: ['pending', 'in-progress', 'completed', 'rejected', 'cancelled'],
            default: 'pending'
        },
        // Attachments
        attachments: [{
            filename: String,
            originalName: String,
            url: String,
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
        // Escalation (employee → admin)
        isEscalated: {
            type: Boolean,
            default: false
        },
        escalatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'kebeleUser'
        },
        escalatedAt: Date,
        escalationNote: {
            type: String,
            maxlength: [1000, 'Escalation note cannot exceed 1000 characters']
        },
        // Assigned employee (set during auto-assign)
        assignedEmployee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'kebeleUser'
        },
        // If converted to a job
        job: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Job'
        },
        // Timestamps
        resolvedAt: Date,
        // Issued Document (populated when employee approves certificate/permit)
        issuedDocument: {
            documentNumber: String,
            documentType: String,
            issuedAt: Date,
            issuedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'kebeleUser'
            },
            expiresAt: Date,
            isLegalized: { type: Boolean, default: true },
            signatoryName: { type: String, default: 'Obsan Habtamu' },
            signatoryTitle: { type: String, default: 'Ganda Manager' },
            registrationNumber: String,
            formSnapshot: mongoose.Schema.Types.Mixed,
        },
        isDeleted: {
            type: Boolean,
            default: false
        },
        lateRegistration: {
            type: Boolean,
            default: false
        },
        escalationLevel: {
            type: Number,
            default: 0
        }
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
