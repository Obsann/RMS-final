const logger = require('../config/logger');
const Request = require('../models/Request');
const Job = require('../models/Job');
const User = require('../models/authmodel');

/**
 * Create a new request (resident)
 */
const createRequest = async (req, res) => {
    try {
        const { type, category, subject, description, priority } = req.body;

        if (!type || !category || !subject || !description) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Type, category, subject, and description are required'
            });
        }

        // Get user's unit
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'Not Found', message: 'User not found' });
        }

        const request = await Request.create({
            type,
            resident: req.user.id,
            unit: user.unit || 'N/A',
            category,
            subject,
            description,
            priority: priority || 'medium'
        });

        res.status(201).json({
            message: 'Request submitted successfully',
            request
        });
    } catch (error) {
        logger.error('CreateRequest error:', error);
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
};

/**
 * Get requests - residents see their own, admins see all
 */
const getRequests = async (req, res) => {
    try {
        const { type, status, page = 1, limit = 20 } = req.query;

        const query = {};

        // Non-admins can only see their own requests
        if (req.user.role !== 'admin' && req.user.role !== 'special-employee') {
            query.resident = req.user.id;
        }

        if (type) query.type = type;
        if (status) query.status = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [requests, total] = await Promise.all([
            Request.find(query)
                .populate('resident', 'username email unit')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Request.countDocuments(query)
        ]);

        res.json({
            requests,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        logger.error('GetRequests error:', error);
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
};

/**
 * Get single request by ID
 */
const getRequestById = async (req, res) => {
    try {
        const { id } = req.params;

        const request = await Request.findById(id)
            .populate('resident', 'username email unit phone')
            .populate('response.respondedBy', 'username');

        if (!request) {
            return res.status(404).json({ error: 'Not Found', message: 'Request not found' });
        }

        // Check authorization
        if (req.user.role !== 'admin' &&
            req.user.role !== 'special-employee' &&
            request.resident._id.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Forbidden', message: 'Access denied' });
        }

        res.json(request);
    } catch (error) {
        logger.error('GetRequestById error:', error);
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
};

/**
 * Update request status (admin/employee)
 */
const updateRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, response } = req.body;

        if (!['pending', 'in-progress', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Invalid status'
            });
        }

        const updateData = { status };

        if (response) {
            updateData.response = {
                message: response,
                respondedBy: req.user.id,
                respondedAt: new Date()
            };
        }

        if (status === 'completed') {
            updateData.resolvedAt = new Date();
        }

        const request = await Request.findByIdAndUpdate(id, updateData, { new: true })
            .populate('resident', 'username email');

        if (!request) {
            return res.status(404).json({ error: 'Not Found', message: 'Request not found' });
        }

        res.json({ message: 'Request updated', request });
    } catch (error) {
        logger.error('UpdateRequestStatus error:', error);
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
};

/**
 * Convert request to job (admin)
 */
const convertToJob = async (req, res) => {
    try {
        const { id } = req.params;
        const { assignedTo, priority, dueDate } = req.body;

        const request = await Request.findById(id);
        if (!request) {
            return res.status(404).json({ error: 'Not Found', message: 'Request not found' });
        }

        if (request.type !== 'maintenance') {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Only maintenance requests can be converted to jobs'
            });
        }

        if (request.job) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Request already converted to a job'
            });
        }

        // Create job
        const job = await Job.create({
            title: request.subject,
            description: request.description,
            category: request.category,
            priority: priority || request.priority,
            unit: request.unit,
            sourceRequest: request._id,
            assignedTo,
            assignedBy: req.user.id,
            assignedAt: assignedTo ? new Date() : null,
            status: assignedTo ? 'assigned' : 'pending',
            dueDate,
            createdBy: req.user.id
        });

        // Update request with job reference
        request.job = job._id;
        request.status = 'in-progress';
        await request.save();

        res.status(201).json({
            message: 'Request converted to job',
            job,
            request
        });
    } catch (error) {
        logger.error('ConvertToJob error:', error);
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
};

/**
 * Delete request (admin only)
 */
const deleteRequest = async (req, res) => {
    try {
        const { id } = req.params;

        const request = await Request.findByIdAndDelete(id);
        if (!request) {
            return res.status(404).json({ error: 'Not Found', message: 'Request not found' });
        }

        res.json({ message: 'Request deleted successfully' });
    } catch (error) {
        logger.error('DeleteRequest error:', error);
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
};

module.exports = {
    createRequest,
    getRequests,
    getRequestById,
    updateRequestStatus,
    convertToJob,
    deleteRequest
};
