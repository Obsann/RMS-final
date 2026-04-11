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
      // Delete the uploaded file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        error: 'Bad Request',
        message: 'File type not allowed. Allowed: JPEG, PNG, GIF, PDF, DOC, DOCX'
      });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (req.file.size > maxSize) {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        error: 'Bad Request',
        message: 'File size too large. Maximum: 5MB'
      });
    }

    // Save metadata to database
    const fileDoc = await File.create({
      originalName: req.file.originalname,
      filename: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.user.id
    });

    const fileInfo = {
      id: fileDoc._id,
      originalName: fileDoc.originalName,
      filename: fileDoc.filename,
      mimeType: fileDoc.mimeType,
      size: fileDoc.size,
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
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
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
 * Serve a single file by filename - WITH AUTH & PATH TRAVERSAL PROTECTION
 */
const getFile = async (req, res) => {
  try {
    const { name } = req.params;

    // Validate filename to prevent path traversal
    if (!isValidFilename(name)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid filename'
      });
    }

    // Find file metadata in DB
    const fileDoc = await File.findOne({ filename: name });

    if (!fileDoc) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'File not found'
      });
    }

    // Authorization: User must own the file or be an admin
    if (req.user.id !== fileDoc.uploadedBy.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied'
      });
    }

    // Use path.basename as additional protection
    const safeName = path.basename(name);
    const filePath = path.join(UPLOAD_DIR, safeName);

    // Verify the resolved path is still within UPLOAD_DIR
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(path.resolve(UPLOAD_DIR))) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid file path'
      });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'File does not exist on disk'
      });
    }

    res.sendFile(resolvedPath);
  } catch (err) {
    logger.error('GetFile error:', err);
    res.status(500).json({ error: 'Server Error', message: err.message });
  }
};

/**
 * Delete a file by filename (admin only) - WITH PATH TRAVERSAL PROTECTION
 */
const deleteFile = async (req, res) => {
  try {
    const { name } = req.params;

    // Validate filename to prevent path traversal
    if (!isValidFilename(name)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid filename'
      });
    }

    const safeName = path.basename(name);
    const filePath = path.join(UPLOAD_DIR, safeName);

    // Verify the resolved path is still within UPLOAD_DIR
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(path.resolve(UPLOAD_DIR))) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid file path'
      });
    }

    // Remove from DB first
    const deletedFile = await File.findOneAndDelete({ filename: name });
    if (!deletedFile) {
      // If not in DB, it might be a legacy file or already deleted
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'File does not exist'
        });
      }
    }

    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }

    res.json({ message: 'File deleted successfully' });
  } catch (err) {
    logger.error('DeleteFile error:', err);
    res.status(500).json({ error: 'Server Error', message: err.message });
  }
};

module.exports = { uploadFile, getFiles, getFile, deleteFile };
