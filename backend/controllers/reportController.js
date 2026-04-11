const logger = require('../config/logger');
const User = require('../models/authmodel');
const Request = require('../models/Request');
const Job = require('../models/Job');
const DigitalId = require('../models/DigitalId');
const Household = require('../models/Household');
const { checkLongPendingDigitalIds } = require('../middleware/suspiciousActivity');

/**
 * Get overview dashboard statistics (admin only)
 */
const getOverview = async (req, res) => {
    try {
        // Fire stale digital ID check silently on each dashboard load
        checkLongPendingDigitalIds(72).catch(() => { });
        const [
            totalUsers,
            pendingUsers,
            approvedUsers,
            totalResidents,
            totalEmployees,
            totalRequests,
            pendingRequests,
            completedRequests,
            totalJobs,
            pendingJobs,
            completedJobs,
            totalDigitalIds,
            approvedDigitalIds,
            totalHouseholds
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ status: 'pending' }),
            User.countDocuments({ status: 'approved' }),
            User.countDocuments({ role: 'resident' }),
            User.countDocuments({ role: { $in: ['employee', 'special-employee'] } }),
            Request.countDocuments(),
            Request.countDocuments({ status: 'pending' }),
            Request.countDocuments({ status: 'completed' }),
            Job.countDocuments(),
            Job.countDocuments({ status: { $in: ['pending', 'assigned'] } }),
            Job.countDocuments({ status: 'completed' }),
            DigitalId.countDocuments(),
            DigitalId.countDocuments({ status: 'approved' }),
            Household.countDocuments()
        ]);

        res.json({
            users: {
                total: totalUsers,
                pending: pendingUsers,
                approved: approvedUsers,
                residents: totalResidents,
                employees: totalEmployees
            },
            requests: {
                total: totalRequests,
                pending: pendingRequests,
                completed: completedRequests
            },
            jobs: {
                total: totalJobs,
                pending: pendingJobs,
                completed: completedJobs
            },
            digitalIds: {
                total: totalDigitalIds,
                approved: approvedDigitalIds
            },
            households: {
                total: totalHouseholds
            }
        });
    } catch (error) {
        logger.error('GetOverview error:', error);
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
};

/**
 * Get demographic report (admin only)
 */
const getDemographics = async (req, res) => {
    try {
        const [
            byRole,
            byStatus,
            registrationTrend,
            byUnit
        ] = await Promise.all([
            // Users by role
            User.aggregate([
                { $group: { _id: '$role', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            // Users by status
            User.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            // Registration trend (last 12 months)
            User.aggregate([
                {
                    $match: {
                        createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
                    }
                },
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' }
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]),
            // Users by unit
            User.aggregate([
                { $match: { unit: { $exists: true, $ne: null } } },
                { $group: { _id: '$unit', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 20 }
            ])
        ]);

        res.json({
            byRole,
            byStatus,
            registrationTrend,
            byUnit
        });
    } catch (error) {
        logger.error('GetDemographics error:', error);
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
};

/**
 * Get request statistics report (admin only)
 */
const getRequestReport = async (req, res) => {
    try {
        const [
            byType,
            byStatus,
            byPriority,
            requestTrend,
            avgResolutionTime
        ] = await Promise.all([
            Request.aggregate([
                { $group: { _id: '$type', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            Request.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            Request.aggregate([
                { $group: { _id: '$priority', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            Request.aggregate([
                {
                    $match: {
                        createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
                    }
                },
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' }
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]),
            Request.aggregate([
                { $match: { status: 'completed', resolvedAt: { $exists: true } } },
                {
                    $project: {
                        resolutionTime: { $subtract: ['$resolvedAt', '$createdAt'] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        avgTime: { $avg: '$resolutionTime' },
                        minTime: { $min: '$resolutionTime' },
                        maxTime: { $max: '$resolutionTime' }
                    }
                }
            ])
        ]);

        res.json({
            byType,
            byStatus,
            byPriority,
            requestTrend,
            avgResolutionTime: avgResolutionTime[0] || { avgTime: 0, minTime: 0, maxTime: 0 }
        });
    } catch (error) {
        logger.error('GetRequestReport error:', error);
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
};

module.exports = {
    getOverview,
    getDemographics,
    getRequestReport
};
