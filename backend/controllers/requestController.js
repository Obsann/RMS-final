const logger = require('../config/logger');
const Request = require('../models/Request');
const Job = require('../models/Job');
const User = require('../models/authmodel');
const { autoAssignJob } = require('./jobController');

// Maps categoryTag → employee jobCategory for auto-assignment
const CATEGORY_TAG_TO_JOB_CATEGORY = {
    'ID_REGISTRATION': 'ID & Registration',
    'DOCUMENT_PROCESSING': 'Document Processing',
    'COMPLAINT_HANDLING': 'Complaint Handling',
};

/**
 * Create a new request (resident)
 * If a categoryTag is provided (Service Hub flow), auto-creates a Job for employees.
 */
const createRequest = async (req, res) => {
    try {
        const { type, category, subject, description, priority, serviceType, categoryTag, formData, attachments } = req.body;

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
            priority: priority || 'medium',
            serviceType: serviceType || null,
            categoryTag: categoryTag || null,
            formData: formData || null,
            attachments: attachments || [],
        });

        let job = null;

        // Service Hub flow: auto-create a Job for employees
        if (categoryTag && CATEGORY_TAG_TO_JOB_CATEGORY[categoryTag]) {
            const jobCategory = CATEGORY_TAG_TO_JOB_CATEGORY[categoryTag];

            // Build a human-readable description from formData
            let jobDescription = description;
            if (formData && typeof formData === 'object') {
                const details = Object.entries(formData)
                    .filter(([, v]) => v != null && v !== '')
                    .map(([k, v]) => `${k.replace(/([A-Z])/g, ' $1').trim()}: ${v}`)
                    .join('\n');
                if (details) {
                    jobDescription += '\n\n--- Form Details ---\n' + details;
                }
            }

            // Auto-assign to least-loaded matching employee
            const assignedEmployee = await autoAssignJob(jobCategory);

            job = await Job.create({
                title: `${serviceType || category} — ${subject}`,
                description: jobDescription,
                category: jobCategory,
                priority: priority || 'medium',
                unit: user.unit || 'N/A',
                sourceRequest: request._id,
                createdBy: req.user.id,
                assignedTo: assignedEmployee?._id || null,
                assignedBy: assignedEmployee ? req.user.id : null,
                assignedAt: assignedEmployee ? new Date() : null,
                status: assignedEmployee ? 'assigned' : 'pending',
            });

            // Link the job back to the request
            request.job = job._id;
            if (assignedEmployee) {
                request.status = 'in-progress';
            }
            await request.save();
        }

        res.status(201).json({
            message: 'Request submitted successfully',
            request,
            job,
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
        const { type, status, page = 1, limit = 20, escalatedOnly } = req.query;

        const query = {};

        // Admin only sees escalated requests (forwarded by employees)
        if (req.user.role === 'admin') {
            if (escalatedOnly !== 'false') {
                query.isEscalated = true;
            }
        } else if (req.user.role === 'employee' || req.user.role === 'special-employee') {
            // Employees and special employees see ALL resident requests so they can handle them
            // No filter by resident — they see everything
        } else {
            // Residents only see their own requests
            query.resident = req.user.id;
        }

        if (type) query.type = type;
        if (status) query.status = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [requests, total] = await Promise.all([
            Request.find(query)
                .populate('resident', 'username email unit phone')
                .populate('escalatedBy', 'username email')
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

/**
 * Escalate request to admin (employee/special-employee)
 * Marks a request as escalated so it appears on the admin dashboard
 */
const escalateRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { note } = req.body;

        const request = await Request.findById(id);
        if (!request) {
            return res.status(404).json({ error: 'Not Found', message: 'Request not found' });
        }

        if (request.isEscalated) {
            return res.status(400).json({ error: 'Bad Request', message: 'Request is already escalated' });
        }

        request.isEscalated = true;
        request.escalatedBy = req.user.id;
        request.escalatedAt = new Date();
        request.escalationNote = note || 'Escalated by employee — requires admin attention';
        await request.save();

        const populated = await Request.findById(id)
            .populate('resident', 'username email unit')
            .populate('escalatedBy', 'username email');

        res.json({ message: 'Request escalated to admin', request: populated });
    } catch (error) {
        logger.error('EscalateRequest error:', error);
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
};

module.exports = {
    createRequest,
    getRequests,
    getRequestById,
    updateRequestStatus,
    convertToJob,
    deleteRequest,
    escalateRequest
};
