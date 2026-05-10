const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const uploadController = require('../controllers/uploadController');

const router = express.Router();

const { generalStorage } = require('../config/cloudinary');

// Multer storage config with Cloudinary
const upload = multer({
	storage: generalStorage,
	limits: {
		fileSize: 15 * 1024 * 1024 // 15MB max
	}
});

// Note: Cloudinary handles file types, but we could add a fileFilter if strictly needed.

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
	if (err instanceof multer.MulterError) {
		if (err.code === 'LIMIT_FILE_SIZE') {
			return res.status(400).json({
				error: 'Bad Request',
				message: 'File size too large. Maximum: 5MB'
			});
		}
		return res.status(400).json({
			error: 'Bad Request',
			message: err.message
		});
	}
	if (err) {
		return res.status(400).json({
			error: 'Bad Request',
			message: err.message
		});
	}
	next();
};

// Routes
// POST /api/uploads/ - upload a single file (requires auth)
router.post('/',
	authMiddleware,
	upload.single('file'),
	handleMulterError,
	uploadController.uploadFile
);

// GET /api/uploads/ - list uploaded files (admin only)
router.get('/', authMiddleware, adminAuth, uploadController.getFiles);

// GET /api/uploads/:name - download/serve a file (requires auth)
router.get('/:name', authMiddleware, uploadController.getFile);

// DELETE /api/uploads/:name - delete a file (admin only)
router.delete('/:name', authMiddleware, adminAuth, uploadController.deleteFile);

module.exports = router;
