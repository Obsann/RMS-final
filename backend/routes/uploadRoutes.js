const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const uploadController = require('../controllers/uploadController');

const router = express.Router();

// Ensure uploads directory exists before multer tries to write into it
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
	fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer storage config with security
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, UPLOAD_DIR);
	},
	filename: function (req, file, cb) {
		// Generate unique filename with timestamp
		const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
		// Sanitize original filename
		const ext = path.extname(file.originalname).toLowerCase();
		cb(null, unique + ext);
	}
});

// File filter for allowed types
const fileFilter = (req, file, cb) => {
	const allowedTypes = [
		'image/jpeg',
		'image/png',
		'image/gif',
		'application/pdf',
		'application/msword',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
	];

	if (allowedTypes.includes(file.mimetype)) {
		cb(null, true);
	} else {
		cb(new Error('File type not allowed'), false);
	}
};

const upload = multer({
	storage,
	fileFilter,
	limits: {
		fileSize: 5 * 1024 * 1024 // 5MB max
	}
});

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
