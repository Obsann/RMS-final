const logger = require('../config/logger');
const Job = require('../models/Job');
const User = require('../models/authmodel');

/**
 * Auto-assign a job to the least-loaded employee matching the job's category
 */
const autoAssignJob = async (category, excludeId = null) => {
    try {
        // Find approved employees/special-employees matching category (case-insensitive)
        const matchQuery = {
            role: { $in: ['employee', 'special-employee'] },
            status: 'approved'
        };

        if (category) {
            matchQuery.jobCategory = { $regex: new RegExp(`^${category.replace(/[.*+?^${}()|[\]\\\\]/g, '\\\\$&')}$`, 'i') };
        }

        const employees = await User.find(matchQuery).select('_id username jobCategory');

        if (employees.length === 0) return null;

        // Count active (non-completed, non-cancelled) jobs for each
        const jobCounts = await Promise.all(
            employees.map(async (emp) => {
                const count = await Job.countDocuments({
                    assignedTo: emp._id,
                    status: { $in: ['assigned', 'in-progress'] }
                });
                return { employee: emp, count };
            })
        );

        // Sort by fewest active jobs, pick first
        jobCounts.sort((a, b) => a.count - b.count);
        return jobCounts[0].employee;
    } catch (error) {
        logger.error('AutoAssignJob error:', error);
        return null;
    }
};

/**
 * Create a new job (admin)
 */
const createJob = async (req, res) => {
    try {
        const { title, description, category, priority, unit, location, assignedTo, dueDate } = req.body;

        if (!title || !description || !category) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Title, description, and category are required'
            });
        }

        const jobData = {
            title,
            description,
            category,
            priority: priority || 'medium',
            unit,
            location,
            createdBy: req.user.id,
            dueDate
        };

        if (assignedTo) {
            // Verify employee exists
            const employee = await User.findById(assignedTo);
            if (!employee || !['employee', 'special-employee'].includes(employee.role)) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Invalid employee assignment'
                });
            }
            jobData.assignedTo = assignedTo;
            jobData.assignedBy = req.user.id;
            jobData.assignedAt = new Date();
            jobData.status = 'assigned';
        } else {
            // Auto-assign to least-loaded employee matching the category
            const autoEmployee = await autoAssignJob(category);
            if (autoEmployee) {
                jobData.assignedTo = autoEmployee._id;
                jobData.assignedBy = req.user.id;
                jobData.assignedAt = new Date();
                jobData.status = 'assigned';
            }
        }

        const job = await Job.create(jobData);

        // Populate for response
        const populated = await Job.findById(job._id)
            .populate('assignedTo', 'username email jobCategory');

        res.status(201).json({
            message: jobData.assignedTo
                ? `Job created and assigned to ${populated.assignedTo?.username || 'employee'}`
                : 'Job created (no matching employee found for auto-assignment)',
            job: populated
        });
    } catch (error) {
        logger.error('CreateJob error:', error);
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
};

/**
 * Get jobs - employees see assigned, admins see all
 */
const getJobs = async (req, res) => {
    try {
        const { status, category, assignedTo, page = 1, limit = 20 } = req.query;

        const query = {};

        // Employees only see their assigned jobs
        if (req.user.role === 'employee') {
            query.assignedTo = req.user.id;
        } else if (assignedTo) {
            query.assignedTo = assignedTo;
        }

        if (status) query.status = status;
        if (category) query.category = category;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [jobs, total] = await Promise.all([
            Job.find(query)
                .populate('assignedTo', 'username email jobCategory')
                .populate('createdBy', 'username')
                .populate('sourceRequest', 'type subject')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Job.countDocuments(query)
        ]);

        res.json({
            jobs,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        logger.error('GetJobs error:', error);
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
};

/**
 * Get job by ID
 */
const getJobById = async (req, res) => {
    try {
        const { id } = req.params;

        const job = await Job.findById(id)
            .populate('assignedTo', 'username email phone jobCategory')
            .populate('createdBy', 'username')
            .populate('assignedBy', 'username')
            .populate('sourceRequest');

        if (!job) {
            return res.status(404).json({ error: 'Not Found', message: 'Job not found' });
        }

        // Check authorization for employees
        if (req.user.role === 'employee' &&
            job.assignedTo?._id.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Forbidden', message: 'Access denied' });
        }

        res.json(job);
    } catch (error) {
        logger.error('GetJobById error:', error);
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
};

/**
 * Update job
 */
const updateJob = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, assignedTo, priority, dueDate, completionNotes } = req.body;

        const job = await Job.findById(id);
        if (!job) {
            return res.status(404).json({ error: 'Not Found', message: 'Job not found' });
        }

        // Employees can only update status and completion notes
        if (req.user.role === 'employee') {
            if (job.assignedTo?.toString() !== req.user.id) {
                return res.status(403).json({ error: 'Forbidden', message: 'Access denied' });
            }
            // Only allow status updates for assigned employees
            if (status) {
                job.status = status;
                if (status === 'completed') {
                    job.completedAt = new Date();
                }
            }
            if (completionNotes) job.completionNotes = completionNotes;
        } else {
            // Admin can update everything
            if (status) {
                job.status = status;
                if (status === 'completed') {
                    job.completedAt = new Date();
                }
            }
            if (assignedTo !== undefined) {
                job.assignedTo = assignedTo || null;
                if (assignedTo) {
                    job.assignedBy = req.user.id;
                    job.assignedAt = new Date();
                    if (job.status === 'pending') job.status = 'assigned';
                }
            }
            if (priority) job.priority = priority;
            if (dueDate) job.dueDate = dueDate;
            if (completionNotes) job.completionNotes = completionNotes;
        }

        await job.save();

        res.json({ message: 'Job updated', job });
    } catch (error) {
        logger.error('UpdateJob error:', error);
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
};

/**
 * Assign job to employee (admin)
 */
const assignJob = async (req, res) => {
    try {
        const { id } = req.params;
        const { employeeId } = req.body;

        if (!employeeId) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Employee ID is required'
            });
        }

        const employee = await User.findById(employeeId);
        if (!employee || !['employee', 'special-employee'].includes(employee.role)) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Invalid employee'
            });
        }

        const job = await Job.findByIdAndUpdate(
            id,
            {
                assignedTo: employeeId,
                assignedBy: req.user.id,
                assignedAt: new Date(),
                status: 'assigned'
            },
            { new: true }
        ).populate('assignedTo', 'username email');

        if (!job) {
            return res.status(404).json({ error: 'Not Found', message: 'Job not found' });
        }

        res.json({ message: 'Job assigned', job });
    } catch (error) {
        logger.error('AssignJob error:', error);
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
};

/**
 * Delete job (admin only)
 */
const deleteJob = async (req, res) => {
    try {
        const { id } = req.params;

        const job = await Job.findByIdAndDelete(id);
        if (!job) {
            return res.status(404).json({ error: 'Not Found', message: 'Job not found' });
        }

        res.json({ message: 'Job deleted successfully' });
    } catch (error) {
        logger.error('DeleteJob error:', error);
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
};

/**
 * Get job statistics (admin)
 */
const getJobStats = async (req, res) => {
    try {
        const [
            total,
            pending,
            assigned,
            inProgress,
            completed
        ] = await Promise.all([
            Job.countDocuments(),
            Job.countDocuments({ status: 'pending' }),
            Job.countDocuments({ status: 'assigned' }),
            Job.countDocuments({ status: 'in-progress' }),
            Job.countDocuments({ status: 'completed' })
        ]);

        // Jobs by category
        const byCategory = await Job.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        res.json({
            total,
            byStatus: { pending, assigned, inProgress, completed },
            byCategory
        });
    } catch (error) {
        logger.error('GetJobStats error:', error);
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
};

module.exports = {
    createJob,
    getJobs,
    getJobById,
    updateJob,
    assignJob,
    deleteJob,
    getJobStats
};
