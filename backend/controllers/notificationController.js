const logger = require('../config/logger');
const Notification = require('../models/Notification');

/**
 * Helper: Create a notification (used by other controllers)
 */
const createNotification = async ({ userId, type, title, message, relatedId, relatedType }) => {
    try {
        return await Notification.create({
            userId,
            type,
            title,
            message,
            relatedId,
            relatedType
        });
    } catch (error) {
        logger.error('Create notification failed:', error.message);
        return null;
    }
};

/**
 * Get notifications for the authenticated user
 */
const getUserNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 20, unreadOnly } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const query = { userId: req.user.id };
        if (unreadOnly === 'true') query.readStatus = false;

        const [notifications, total, unreadCount] = await Promise.all([
            Notification.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Notification.countDocuments(query),
            Notification.countDocuments({ userId: req.user.id, readStatus: false })
        ]);

        res.json({
            notifications,
            unreadCount,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        logger.error('GetUserNotifications error:', error);
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
};

/**
 * Mark a notification as read
 */
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        const notification = await Notification.findOneAndUpdate(
            { _id: id, userId: req.user.id },
            { readStatus: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ error: 'Not Found', message: 'Notification not found' });
        }

        res.json({ message: 'Notification marked as read', notification });
    } catch (error) {
        logger.error('MarkAsRead error:', error);
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
};

/**
 * Mark all notifications as read
 */
const markAllRead = async (req, res) => {
    try {
        const result = await Notification.updateMany(
            { userId: req.user.id, readStatus: false },
            { readStatus: true }
        );

        res.json({
            message: 'All notifications marked as read',
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        logger.error('MarkAllRead error:', error);
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
};

/**
 * Delete a notification
 */
const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;

        const notification = await Notification.findOneAndDelete({
            _id: id,
            userId: req.user.id
        });

        if (!notification) {
            return res.status(404).json({ error: 'Not Found', message: 'Notification not found' });
        }

        res.json({ message: 'Notification deleted' });
    } catch (error) {
        logger.error('DeleteNotification error:', error);
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
};

/**
 * Send announcement to all users or users by role (admin only)
 */
const sendAnnouncement = async (req, res) => {
    try {
        const { title, message, targetRole } = req.body;

        if (!title || !message) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Title and message are required'
            });
        }

        const User = require('../models/authmodel');
        const query = { status: 'approved' };
        if (targetRole) query.role = targetRole;

        const users = await User.find(query).select('_id');

        const notifications = users.map(user => ({
            userId: user._id,
            type: 'announcement',
            title,
            message
        }));

        await Notification.insertMany(notifications);

        res.status(201).json({
            message: `Announcement sent to ${users.length} users`,
            recipientCount: users.length
        });
    } catch (error) {
        logger.error('SendAnnouncement error:', error);
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
};

/**
 * Send a direct message to a single user (admin only)
 */
const sendDirectMessage = async (req, res) => {
    try {
        const { userId, title, message } = req.body;

        if (!userId || !title || !message) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'userId, title, and message are required'
            });
        }

        const User = require('../models/authmodel');
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Not Found', message: 'User not found' });
        }

        const notification = await Notification.create({
            userId,
            type: 'announcement',
            title,
            message
        });

        res.status(201).json({
            message: `Direct message sent to ${user.username}`,
            notification
        });
    } catch (error) {
        logger.error('SendDirectMessage error:', error);
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
};

module.exports = {
    createNotification,
    getUserNotifications,
    markAsRead,
    markAllRead,
    deleteNotification,
    sendAnnouncement,
    sendDirectMessage
};
