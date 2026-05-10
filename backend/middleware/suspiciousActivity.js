/**
 * Suspicious Activity Reporter
 * Automatically sends a notification to all admins when an employee performs
 * high-risk actions: adding/removing residents or employees, or when digital IDs
 * remain pending for too long (checked on each login/overview fetch).
 */
const User = require('../models/authmodel');
const Notification = require('../models/Notification');
const logger = require('../config/logger');

const SENSITIVE_ACTIONS = {
    CREATE_USER: true,
    DELETE_USER: true,
};

/**
 * Finds all admin user IDs to send alert notifications to.
 */
const getAdminIds = async () => {
    const admins = await User.find({ role: 'admin' }).select('_id').lean();
    return admins.map(a => a._id.toString());
};

/**
 * Send a suspicious-activity notification to all admins.
 * @param {object} actor - { id, username, role }
 * @param {string} action - Human-readable description of the action
 * @param {string} detail - Extra detail (e.g., affected user's name/role)
 */
const reportSuspiciousActivity = async (actor, action, detail = '') => {
    try {
        const adminIds = await getAdminIds();
        if (!adminIds.length) return;

        const title = `⚠️ Employee Action: ${action}`;
        const message = `Employee "${actor.username || actor.id}" performed: ${action}${detail ? ` — ${detail}` : ''}. Review audit logs for details.`;

        await Promise.all(
            adminIds.map(adminId =>
                Notification.create({
                    userId: adminId,
                    type: 'urgent',
                    title,
                    message,
                    relatedType: 'audit',
                })
            )
        );
        logger.warn(`SUSPICIOUS ACTIVITY: ${actor.username || actor.id} → ${action} ${detail}`);
    } catch (err) {
        logger.error('reportSuspiciousActivity failed:', err.message);
    }
};

/**
 * Express middleware: wraps POST /users and DELETE /users/:id
 * and fires suspicious activity notifications when performed by employee.
 */
const suspiciousActivityMiddleware = (req, res, next) => {
    const actor = req.user;
    if (!actor || actor.role !== 'employee') return next();

    const method = req.method;
    const isSensitive = (method === 'POST') || (method === 'DELETE');
    if (!isSensitive) return next();

    // Intercept the response to check success before alerting
    const originalJson = res.json.bind(res);
    res.json = function (body) {
        const statusCode = res.statusCode;
        if (statusCode >= 200 && statusCode < 300) {
            let action, detail;
            if (method === 'POST') {
                const created = body.user;
                const role = req.body?.role || 'resident';
                action = `Added new ${role}`;
                detail = created ? `${created.username} (${created.email})` : '';
            } else if (method === 'DELETE') {
                action = 'Removed a user';
                detail = body.user ? `${body.user.username}` : `ID: ${req.params?.id}`;
            }
            // Fire async — don't await so response is not delayed
            reportSuspiciousActivity(actor, action, detail);
        }
        return originalJson(body);
    };

    next();
};

/**
 * Check for long-pending digital IDs and alert admins.
 * Call this periodically (e.g., on dashboard load).
 * @param {number} thresholdHours - How many hours before flagging (default: 72h)
 */
const checkLongPendingDigitalIds = async (thresholdHours = 72) => {
    try {
        const DigitalId = require('../models/DigitalId');
        if (!DigitalId) return;

        const cutoff = new Date(Date.now() - thresholdHours * 60 * 60 * 1000);
        const stale = await DigitalId.find({
            status: 'pending',
            createdAt: { $lt: cutoff },
        }).populate('resident', 'username unit').lean();

        if (!stale.length) return;

        const adminIds = await getAdminIds();
        if (!adminIds.length) return;

        const title = `⏰ ${stale.length} Digital ID request${stale.length > 1 ? 's' : ''} pending over ${thresholdHours}h`;
        const message = `${stale.length} Digital ID request(s) have been pending for more than ${thresholdHours} hours without being assigned or processed. Please review.`;

        await Promise.all(
            adminIds.map(adminId =>
                Notification.create({ userId: adminId, type: 'urgent', title, message, relatedType: 'digital-id' })
            )
        );
        logger.warn(`STALE DIGITAL IDs: ${stale.length} pending > ${thresholdHours}h`);
    } catch (err) {
        // Silently ignore if DigitalId model not found
        if (!err.message?.includes('Cannot find module')) {
            logger.error('checkLongPendingDigitalIds error:', err.message);
        }
    }
};

module.exports = { suspiciousActivityMiddleware, reportSuspiciousActivity, checkLongPendingDigitalIds };
