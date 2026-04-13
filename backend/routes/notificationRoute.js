const express = require('express');
const {
    getUserNotifications,
    markAsRead,
    markAllRead,
    deleteNotification,
    sendAnnouncement,
    sendDirectMessage
} = require('../controllers/notificationController');
const authMiddleware = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get own notifications
router.get('/', getUserNotifications);

// Mark all as read (must be BEFORE /:id/read to prevent path collision)
router.patch('/read-all', markAllRead);

// Mark single notification as read
router.patch('/:id/read', markAsRead);

// Delete a notification
router.delete('/:id', deleteNotification);

// Send group announcement (admin only)
router.post('/announce', adminAuth, sendAnnouncement);

// Send direct message to individual user (admin only)
router.post('/direct', adminAuth, sendDirectMessage);

module.exports = router;
