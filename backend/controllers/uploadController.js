const logger = require('../config/logger');
const fs = require('fs');
const path = require('path');
const File = require('../models/File');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Validate filename to prevent path traversal attacks
 */
const isValidFilename = (filename) => {
  // Reject if filename contains path traversal patterns
  if (!filename || typeof filename !== 'string') return false;
  if (filename.includes('..')) return false;
  if (filename.includes('/')) return false;
  if (filename.includes('\\')) return false;
  if (filename.includes('\0')) return false; // Null byte
  // Only allow alphanumeric, dash, underscore, and dot
  return /^[\w\-. ]+$/.test(filename);
};

/**
 * Upload handler (multer will attach req.file)
 */
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No file uploaded'
      });
    }

    // Validate file type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      // Delete from Cloudinary if needed, usually Cloudinary handles validation before this.
      return res.status(400).json({
        error: 'Bad Request',
        message: 'File type not allowed. Allowed: JPEG, PNG, GIF, PDF, DOC, DOCX'
      });
    }

    // Validate file size (max 5MB)
    const maxSize = 15 * 1024 * 1024;
    if (req.file.size > maxSize) {
      // With Cloudinary, if we need to delete we would use cloudinary.uploader.destroy(req.file.filename)
      // but it's okay to skip for size limit since multer limit handles it before uploading to Cloudinary.
      return res.status(400).json({
        error: 'Bad Request',
        message: 'File size too large. Maximum: 5MB'
      });
    }

    // req.file.path contains the URL for Cloudinary, but a local file path for disk storage.
    // Only save the URL if it's actually an HTTP URL.
    const isCloudinary = req.file.path && req.file.path.startsWith('http');

    // Save metadata to database
    const fileDoc = await File.create({
      originalName: req.file.originalname,
      filename: req.file.filename || req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size || 0,
      url: isCloudinary ? req.file.path : null,
      uploadedBy: req.user.id
    });

    const fileInfo = {
      id: fileDoc._id,
      originalName: fileDoc.originalName,
      filename: fileDoc.filename,
      mimeType: fileDoc.mimeType,
      size: fileDoc.size,
      url: fileDoc.url,
      uploadedBy: fileDoc.uploadedBy,
      uploadedAt: fileDoc.uploadedAt
    };

    res.status(201).json({
      message: 'File uploaded successfully',
      file: fileInfo
    });
  } catch (err) {
    logger.error('Upload error:', err);
    // Clean up on error
    if (req.file && req.file.filename) {
        // Here we could delete from Cloudinary using cloudinary.uploader.destroy
    }
    res.status(500).json({ error: 'Server Error', message: err.message });
  }
};

/**
 * List uploaded files (admin only)
 */
const getFiles = async (req, res) => {
  try {
    const files = await File.find()
      .populate('uploadedBy', 'username email')
      .sort({ uploadedAt: -1 });

    res.json({
      count: files.length,
      files
    });
  } catch (err) {
    logger.error('GetFiles error:', err);
    res.status(500).json({ error: 'Server Error', message: err.message });
  }
};

/**
 * Serve a single file by filename - Redirect to Cloudinary URL
 */
const getFile = async (req, res) => {
  try {
    const { name } = req.params;

    // Find file metadata in DB
    const fileDoc = await File.findOne({ filename: name });

    if (!fileDoc) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'File not found'
      });
    }

    // Authorization: User must own the file, or be an admin/employee
    if (
      req.user.id !== fileDoc.uploadedBy.toString() && 
      req.user.role !== 'admin' &&
      req.user.role !== 'employee'
    ) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied'
      });
    }

    if (fileDoc.url) {
        return res.redirect(fileDoc.url);
    } else {
        // Fallback for legacy local files
        const safeName = path.basename(name);
        const filePath = path.join(UPLOAD_DIR, safeName);
        if (!fs.existsSync(filePath)) {
          return res.status(404).json({ error: 'Not Found', message: 'File does not exist on disk' });
        }
        return res.sendFile(path.resolve(filePath));
    }
  } catch (err) {
    logger.error('GetFile error:', err);
    res.status(500).json({ error: 'Server Error', message: err.message });
  }
};

/**
 * Delete a file by filename (admin only)
 */
const deleteFile = async (req, res) => {
  try {
    const { name } = req.params;

    // Remove from DB first
    const deletedFile = await File.findOneAndDelete({ filename: name });
    
    // Check if Cloudinary file
    if (deletedFile && deletedFile.url) {
        const cloudinary = require('../config/cloudinary').cloudinary;
        // filename in Cloudinary is usually the public_id, but the document may have the full id if saved by multer
        await cloudinary.uploader.destroy(deletedFile.filename);
    } else {
        // Fallback for legacy files
        const safeName = path.basename(name);
        const filePath = path.join(UPLOAD_DIR, safeName);
        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath);
        }
    }

    res.json({ message: 'File deleted successfully' });
  } catch (err) {
    logger.error('DeleteFile error:', err);
    res.status(500).json({ error: 'Server Error', message: err.message });
  }
};

module.exports = { uploadFile, getFiles, getFile, deleteFile };
