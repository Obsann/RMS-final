const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [50, 'Username cannot exceed 50 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    password: {
      type: String,
      required: [function() { return this.authProvider === 'local'; }, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters']
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local'
    },
    googleId: {
      type: String
    },
    phone: {
      type: String,
      trim: true
    },
    role: {
      type: String,
      enum: {
        values: ['resident', 'employee', 'special-employee', 'admin'],
        message: '{VALUE} is not a valid role'
      },
      default: 'resident',
      required: true
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'approved', 'rejected'],
        message: '{VALUE} is not a valid status'
      },
      default: 'pending'
    },
    // Profile information
    unit: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true
    },
    dateOfBirth: {
      type: Date
    },
    sex: {
      type: String,
      enum: ['Male', 'Female']
    },
    nationality: {
      type: String,
      trim: true,
      default: 'Ethiopian'
    },
    // For employee categories
    jobCategory: {
      type: String,
      trim: true
    },
    permissions: [{
      type: String,
      enum: ['manage-tasks', 'manage-employees', 'approve-requests', 'view-reports', 'manage-residents', 'digital-id-approval']
    }],
    // File references (profile photo, documents)
    profilePhoto: {
      type: String
    },
    birthCertificate: {
      type: String
    },
    documents: [{
      type: {
        type: String,
        enum: ['id_card', 'proof_of_address', 'employment_letter', 'bank_statement', 'other']
      },
      filename: String,
      uploadDate: { type: Date, default: Date.now },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      }
    }],
    // Dependents/Family members
    dependents: [{
      name: { type: String, required: true },
      relationship: { type: String, required: true },
      age: Number,
      addedAt: { type: Date, default: Date.now }
    }],
    // Emergency contact
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String
    },
    // Digital ID
    digitalId: {
      qrCode: String,
      issuedAt: Date,
      expiresAt: Date,
      status: {
        type: String,
        enum: ['pending', 'verified', 'approved', 'processing', 'issued', 'expired', 'revoked'],
        default: 'pending'
      },
      lastVerified: Date
    },
    // Timestamps for move-in
    moveInDate: Date,
    // Password reset
    resetPasswordToken: String,
    resetPasswordExpires: Date,

    // ── Staff / Employee extended profile ──────────────────
    nationalId: {          // Ethiopian National ID / Kebele ID
      type: String, trim: true
    },
    employeeId: {          // Internal staff badge / registry number
      type: String, trim: true
    },
    maritalStatus: {
      type: String,
      enum: ['Single', 'Married', 'Divorced', 'Widowed', 'Other']
    },
    educationLevel: {
      type: String,
      enum: ['Certificate', 'Diploma', 'Bachelor\'s Degree', 'Master\'s Degree', 'PhD', 'Other']
    },
    fieldOfStudy: { type: String, trim: true },
    employmentStartDate: { type: Date },
    officeLocation: { type: String, trim: true },
    supervisorName: { type: String, trim: true },
    // For admin: system governance notes
    adminNote: { type: String, trim: true, maxlength: 500 },
    // Soft delete
    isDeleted: { type: Boolean, default: false }
  },
  {
    timestamps: true // Adds createdAt and updatedAt automatically
  }
);

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ 'digitalId.qrCode': 1 });
userSchema.index({ googleId: 1 }, { sparse: true });

// Virtual to check if user is active
userSchema.virtual('isActive').get(function () {
  return this.status === 'approved';
});

// Pre-save hook to hash password if it was modified
const bcrypt = require('bcrypt');
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (err) {
    next(err);
  }
});

// Ensure virtuals are included in JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('kebeleUser', userSchema);
