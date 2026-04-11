const mongoose = require('mongoose');

const householdSchema = new mongoose.Schema(
    {
        houseNo: {
            type: String,
            required: [true, 'House number is required'],
            unique: true,
            trim: true
        },
        headOfHousehold: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'kebeleUser',
            required: [true, 'Head of household is required']
        },
        members: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'kebeleUser'
        }],
        address: {
            kebele: { type: String, trim: true },
            woreda: { type: String, trim: true },
            subCity: { type: String, trim: true },
            streetAddress: { type: String, trim: true }
        },
        // Household classification
        type: {
            type: String,
            enum: ['residential', 'commercial', 'mixed'],
            default: 'residential'
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'transferred'],
            default: 'active'
        },
        notes: {
            type: String,
            maxlength: 1000
        }
    },
    {
        timestamps: true
    }
);

// Indexes
householdSchema.index({ houseNo: 1 });
householdSchema.index({ headOfHousehold: 1 });
householdSchema.index({ status: 1 });
householdSchema.index({ 'address.kebele': 1, 'address.woreda': 1 });

module.exports = mongoose.model('Household', householdSchema);
