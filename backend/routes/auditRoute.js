const express = require('express');
const { getAuditLogs, getAuditStats } = require('../middleware/auditMiddleware');
const authMiddleware = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// All routes require admin auth
router.use(authMiddleware);
router.use(adminAuth);

// Get audit logs with filters
router.get('/', getAuditLogs);

// Get audit statistics
router.get('/stats', getAuditStats);

module.exports = router;
