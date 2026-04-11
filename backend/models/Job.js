const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Job title is required'],
            maxlength: [200, 'Title cannot exceed 200 characters']
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            maxlength: [2000, 'Description cannot exceed 2000 characters']
        },
        category: {
            type: String,
            required: [true, 'Category is required'],
            enum: ['Plumbing', 'Electrical', 'HVAC', 'General Maintenance', 'Landscaping', 'Cleaning', 'Security', 'Carpentry', 'Other']
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'urgent'],
            default: 'medium'
        },
        status: {
            type: String,
            enum: ['pending', 'assigned', 'in-progress', 'completed', 'cancelled'],
            default: 'pending'
        },
        // Related request (if created from a request)
        sourceRequest: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Request'
        },
        // Location
        unit: String,
        location: String,
        // Assignment
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'kebeleUser'
        },
        assignedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'kebeleUser'
        },
        assignedAt: Date,
        // Due date
        dueDate: Date,
        // Completion
        completedAt: Date,
        completionNotes: String,
        // Created by
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'kebeleUser',
            required: true
        }
    },
    {
        timestamps: true
    }
);

// Indexes
jobSchema.index({ status: 1 });
jobSchema.index({ assignedTo: 1, status: 1 });
jobSchema.index({ category: 1 });
jobSchema.index({ dueDate: 1 });

module.exports = mongoose.model('Job', jobSchema);
