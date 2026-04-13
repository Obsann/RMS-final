const logger = require('../config/logger');
const bcrypt = require('bcrypt');
const User = require('../models/authmodel.js');

/**
 * Get all users (admin only)
 */
const getAllUsers = async (req, res) => {
  try {
    const { role, status, search, page = 1, limit = 20 } = req.query;

    // Build query
    const query = {};
    if (role) {
      query.role = role;
    } else {
      // By default, exclude admins from general user listings
      query.role = { $ne: 'admin' };
    }
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { unit: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    res.status(200).json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error("GetAllUsers error:", error);
    res.status(500).json({ error: "Server Error", message: error.message });
  }
};

/**
 * Create user (admin only)
 */
const createUser = async (req, res) => {
  try {
    const { username, email, password, role, status, unit, phone, jobCategory, permissions } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }]
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return res.status(409).json({ error: "Conflict", message: "User with this email already exists" });
      }
      return res.status(409).json({ error: "Conflict", message: "Username is already taken" });
    }

    // Create new user (password is automatically hashed by authmodel pre-save hook)
    const newUser = await User.create({
      username,
      email: email.toLowerCase(),
      password,
      role: role || 'resident',
      status: status || 'approved',
      unit,
      phone,
      jobCategory,
      permissions
    });

    res.status(201).json({
      message: "User created successfully",
      user: { id: newUser._id, username: newUser.username, email: newUser.email, role: newUser.role }
    });
  } catch (error) {
    logger.error("CreateUser error:", error);
    res.status(500).json({ error: "Server Error", message: error.message });
  }
};

/**
 * Get user by ID
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Users can only get their own profile unless they're admin
    if (req.user.role !== 'admin' && req.user.id.toString() !== id.toString()) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You can only view your own profile"
      });
    }

    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({ error: "Not Found", message: "User not found" });
    }
    res.status(200).json({ user });
  } catch (error) {
    logger.error("GetUserById error:", error);
    res.status(500).json({ error: "Server error", message: error.message });
  }
};

/**
 * Update user - with field whitelisting to prevent mass assignment
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Users can only update their own profile unless they're admin
    if (req.user.role !== 'admin' && req.user.id.toString() !== id.toString()) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You can only update your own profile"
      });
    }

    // Whitelist allowed fields based on role
    const userAllowedFields = [
      'username', 'phone', 'unit', 'address', 'profilePhoto',
      'dateOfBirth', 'sex', 'nationality', 'emergencyContact',
      'maritalStatus', 'educationLevel', 'fieldOfStudy',
      'employmentStartDate', 'officeLocation', 'supervisorName',
      'nationalId', 'employeeId',
    ];
    const adminAllowedFields = [
      ...userAllowedFields,
      'role', 'status', 'jobCategory', 'permissions', 'adminNote',
    ];

    const allowedFields = req.user.role === 'admin' ? adminAllowedFields : userAllowedFields;

    // Filter updates to only allowed fields
    const rawUpdates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        rawUpdates[field] = req.body[field];
      }
    }

    // Prevent users from changing their own role or status
    if (req.user.role !== 'admin' && req.user.id === id) {
      delete rawUpdates.role;
      delete rawUpdates.status;
    }

    if (req.file) {
      rawUpdates.profilePhoto = `/uploads/${req.file.filename}`;
    }

    if (Object.keys(rawUpdates).length === 0) {
      return res.status(400).json({
        error: "Bad Request",
        message: "No valid fields to update"
      });
    }

    // Expand emergencyContact subdocument into dot-notation to avoid
    // Mongoose runValidators rejection when replacing a whole subdoc via findByIdAndUpdate
    const updates = {};
    for (const [key, val] of Object.entries(rawUpdates)) {
      if (key === 'emergencyContact' && val && typeof val === 'object') {
        if (val.phone !== undefined) updates['emergencyContact.phone'] = val.phone;
        if (val.name !== undefined) updates['emergencyContact.name'] = val.name;
        if (val.relationship !== undefined) updates['emergencyContact.relationship'] = val.relationship;
      } else {
        updates[key] = val;
      }
    }

    const user = await User.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: "Not Found", message: "User not found" });
    }

    res.status(200).json({
      message: "User updated successfully",
      user
    });
  } catch (error) {
    logger.error("UpdateUser error:", error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ error: "Validation Error", message: messages.join(', ') });
    }
    res.status(500).json({ error: "Server error", message: error.message });
  }
};

/**
 * Delete user (admin only)
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (req.user.id === id) {
      return res.status(400).json({
        error: "Bad Request",
        message: "You cannot delete your own account"
      });
    }

    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ error: "Not Found", message: "User not found" });
    }

    res.status(200).json({
      message: "User deleted successfully",
      user: { id: deletedUser._id, username: deletedUser.username }
    });
  } catch (error) {
    logger.error("DeleteUser error:", error);
    res.status(500).json({ error: "Server error", message: error.message });
  }
};

/**
 * Add dependent to user
 */
const addDependent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, relationship, age } = req.body;

    // Users can only add dependents to their own profile
    if (req.user.role !== 'admin' && req.user.id.toString() !== id.toString()) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You can only manage your own dependents"
      });
    }

    if (!name || !relationship) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Name and relationship are required"
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "Not Found", message: "User not found" });
    }

    user.dependents.push({ name, relationship, age });
    await user.save();

    res.status(201).json({
      message: "Dependent added successfully",
      dependents: user.dependents
    });
  } catch (error) {
    logger.error("AddDependent error:", error);
    res.status(500).json({ error: "Server error", message: error.message });
  }
};

/**
 * Remove dependent from user
 */
const removeDependent = async (req, res) => {
  try {
    const { id, dependentId } = req.params;

    // Users can only remove dependents from their own profile
    if (req.user.role !== 'admin' && req.user.id.toString() !== id.toString()) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You can only manage your own dependents"
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "Not Found", message: "User not found" });
    }

    const dependentIndex = user.dependents.findIndex(d => d._id.toString() === dependentId);
    if (dependentIndex === -1) {
      return res.status(404).json({ error: "Not Found", message: "Dependent not found" });
    }

    user.dependents.splice(dependentIndex, 1);
    await user.save();

    res.status(200).json({
      message: "Dependent removed successfully",
      dependents: user.dependents
    });
  } catch (error) {
    logger.error("RemoveDependent error:", error);
    res.status(500).json({ error: "Server error", message: error.message });
  }
};

/**
 * Get users by role (for admin)
 */
const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;

    if (!['resident', 'employee', 'special-employee', 'admin'].includes(role)) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Invalid role specified"
      });
    }

    const users = await User.find({ role })
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      role,
      count: users.length,
      users
    });
  } catch (error) {
    logger.error("GetUsersByRole error:", error);
    res.status(500).json({ error: "Server error", message: error.message });
  }
};

module.exports = {
  getAllUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  addDependent,
  removeDependent,
  getUsersByRole
};
