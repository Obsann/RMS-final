const AuditLog = require('../models/AuditLog');

/**
 * Create an audit log entry (helper function for use in other controllers)
 */
const createAuditLog = async ({ actorId, actorRole, action, targetId, targetType, details, ipAddress, previousValues, newValues }) => {
    try {
        await AuditLog.create({
            actorId,
            actorRole,
            action,
            targetId,
            targetType,
            details,
            ipAddress,
            previousValues,
            newValues
        });
    } catch (error) {
        // Don't let audit logging failures break the main flow
        console.error('Audit log creation failed:', error.message);
    }
};

/**
 * Middleware that auto-logs mutations (POST/PUT/PATCH/DELETE)
 * Attach after auth middleware so req.user is available
 */
const auditMiddleware = (action, targetType) => {
    return (req, res, next) => {
        // Store the original json method
        const originalJson = res.json.bind(res);

        res.json = function (body) {
            // Only log successful mutations
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const logData = {
                    actorId: req.user?.id,
                    actorRole: req.user?.role || 'unknown',
                    action,
                    targetType,
                    ipAddress: req.ip || req.connection?.remoteAddress,
                    details: `${req.method} ${req.originalUrl}`
                };

                // Try to extract target ID from params or response body
                if (req.params?.id) {
                    logData.targetId = req.params.id;
                } else if (body?.user?._id || body?.user?.id) {
                    logData.targetId = body.user._id || body.user.id;
                } else if (body?.request?._id) {
                    logData.targetId = body.request._id;
                } else if (body?.job?._id) {
                    logData.targetId = body.job._id;
                } else if (body?.digitalId?._id) {
                    logData.targetId = body.digitalId._id;
                }

                createAuditLog(logData);
            }

            return originalJson(body);
        };

        next();
    };
};

/**
 * Get audit logs (admin only)
 */
const getAuditLogs = async (req, res) => {
    try {
        const { action, actorId, targetType, startDate, endDate, page = 1, limit = 50 } = req.query;

        const query = {};
        if (action) query.action = action;
        if (actorId) query.actorId = actorId;
        if (targetType) query.targetType = targetType;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [logs, total] = await Promise.all([
            AuditLog.find(query)
                .populate('actorId', 'username email role')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            AuditLog.countDocuments(query)
        ]);

        res.json({
            logs,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('GetAuditLogs error:', error);
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
};

/**
 * Get audit log statistics (admin only)
 */
const getAuditStats = async (req, res) => {
    try {
        const [total, byAction, recentActivity] = await Promise.all([
            AuditLog.countDocuments(),
            AuditLog.aggregate([
                { $group: { _id: '$action', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 20 }
            ]),
            AuditLog.find()
                .populate('actorId', 'username role')
                .sort({ createdAt: -1 })
                .limit(10)
        ]);

        res.json({
            total,
            byAction,
            recentActivity
        });
    } catch (error) {
        console.error('GetAuditStats error:', error);
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
};

module.exports = {
    createAuditLog,
    auditMiddleware,
    getAuditLogs,
    getAuditStats
};
