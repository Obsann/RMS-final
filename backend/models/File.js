const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    originalName: {
        type: String,
        required: true
    },
    filename: {
        type: String,
        required: true,
        unique: true
    },
    mimeType: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: false // true once migrated completely
    },
    size: {
        type: Number,
        required: true
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'kebeleUser',
        required: true
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    }
});

fileSchema.index({ uploadedBy: 1 });
fileSchema.index({ filename: 1 });

module.exports = mongoose.model('File', fileSchema);
