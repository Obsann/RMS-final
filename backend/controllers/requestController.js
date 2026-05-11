const logger = require('../config/logger');
const Request = require('../models/Request');
const Job = require('../models/Job');
const User = require('../models/authmodel');
const File = require('../models/File');
const { cloudinary } = require('../config/cloudinary');
const { autoAssignJob } = require('./jobController');

// Maps categoryTag → employee jobCategory for auto-assignment
const CATEGORY_TAG_TO_JOB_CATEGORY = {
    'ID_REGISTRATION': 'Identity & Registration',
    'CERTIFICATES': 'Certificates',
    'PERMITS': 'Permits',
    'FEEDBACK_SUPPORT': 'Feedback & Support',
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

        // --- Profile Completeness Validation ---
        if (!user.unit || !user.address || !user.phone) {
            return res.status(403).json({ 
                error: 'Forbidden', 
                message: 'Your profile is incomplete. Please update your unit, address, and phone number before requesting services.' 
            });
        }

        // --- Oromia Regulation No. 259/2026 Checks ---
        if (type === 'permit' && category === 'construction_legalization') {
            const blockedCities = ['Shaggar', 'Adama', 'Bishoftu'];
            const city = formData?.city || formData?.address?.city;
            if (city && blockedCities.includes(city)) {
                return res.status(400).json({ error: 'Bad Request', message: `Construction legalization is not permitted in ${city} under Regulation 259/2026.` });
            }

            // Check date range
            const buildDate = formData?.buildDate ? new Date(formData.buildDate) : null;
            const minDate = new Date('2013-03-19');
            const maxDate = new Date('2026-03-26');
            if (buildDate && (buildDate < minDate || buildDate > maxDate)) {
                return res.status(400).json({ error: 'Bad Request', message: 'Construction must be built between March 19, 2013 and March 26, 2026.' });
            }

            // Check 1 house per person
            const existingPermit = await Request.findOne({ resident: req.user.id, type: 'permit', category: 'construction_legalization', isDeleted: { $ne: true } });
            if (existingPermit) {
                return res.status(400).json({ error: 'Bad Request', message: 'Only one construction legalization permit is allowed per person.' });
            }
        }

        // --- Vital Events Validiations & Late Registration ---
        let lateRegistration = false;
        if (type === 'certificate') {
            if (category === 'marriage' || category === 'divorce') {
                const witnesses = formData?.witnesses || [];
                if (!Array.isArray(witnesses) || witnesses.length < 2) {
                    return res.status(400).json({ error: 'Bad Request', message: 'Two witnesses are required for this certificate.' });
                }
                
                if (category === 'divorce') {
                    const proof = formData?.courtDecree || formData?.jaarsummaa;
                    if (!proof) {
                        return res.status(400).json({ error: 'Bad Request', message: 'Proof of divorce (Court Decree or Jaarsummaa) is required.' });
                    }
                }
                
                const eventDate = formData?.eventDate ? new Date(formData.eventDate) : null;
                if (eventDate) {
                    const daysDiff = (new Date() - eventDate) / (1000 * 60 * 60 * 24);
                    if (daysDiff > 30) lateRegistration = true;
                }
            } else if (category === 'birth') {
                const dob = formData?.dateOfBirth ? new Date(formData.dateOfBirth) : null;
                if (dob) {
                    const daysDiff = (new Date() - dob) / (1000 * 60 * 60 * 24);
                    if (daysDiff > 90) lateRegistration = true;
                }
            } else if (category === 'death') {
                const eventDate = formData?.dateOfDeath ? new Date(formData.dateOfDeath) : null;
                if (eventDate) {
                    const daysDiff = (new Date() - eventDate) / (1000 * 60 * 60 * 24);
                    if (daysDiff > 30) lateRegistration = true;
                }
            }
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
            lateRegistration
        });

        // --- Profile Photo Auto-Sync for ID Applications ---
        if (categoryTag === 'ID_REGISTRATION') {
            const photoAttachment = attachments?.find(a => 
                a.originalName && a.originalName.match(/\.(jpg|jpeg|png|webp)$/i)
            );
            if (photoAttachment && photoAttachment.filename) {
                user.profilePhoto = photoAttachment.filename;
                await user.save();
            }
        }

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

            // Link the job back to the request + track assigned employee
            request.job = job._id;
            if (assignedEmployee) {
                request.status = 'in-progress';
                request.assignedEmployee = assignedEmployee._id;
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
 * Get requests - residents see their own, admins see all or escalated, employees see all
 */
const getRequests = async (req, res) => {
    try {
        const { type, status, page = 1, limit = 20, escalatedOnly, categoryTag, user: userId } = req.query;

        const query = { isDeleted: { $ne: true } };

        // Admin: default to escalated-only, but allow escalatedOnly=false for pipeline view
        if (req.user.role === 'admin') {
            if (escalatedOnly !== 'false') {
                query.isEscalated = true;
            }
        } else if (req.user.role === 'employee') {
            // Employees see ALL resident requests so they can handle them
            // No filter by resident — they see everything
        } else {
            // Residents only see their own requests
            query.resident = req.user.id;
        }

        if (type) query.type = type;
        if (status) query.status = status;
        if (categoryTag) query.categoryTag = categoryTag;
        if (userId) query.resident = userId;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [requests, total] = await Promise.all([
            Request.find(query)
                .populate('resident', 'username email unit phone')
                .populate('escalatedBy', 'username email')
                .populate('assignedEmployee', 'username email jobCategory')
                .populate('issuedDocument.issuedBy', 'username email')
                .populate('job')
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
            .populate('response.respondedBy', 'username')
            .populate('assignedEmployee', 'username email jobCategory')
            .populate('job');

        if (!request) {
            return res.status(404).json({ error: 'Not Found', message: 'Request not found' });
        }

        // Check authorization
        if (req.user.role !== 'admin' &&
            req.user.role !== 'employee' &&
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
 * Cascades status to linked Job for bidirectional sync.
 */
const updateRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, response, rejectionReason } = req.body;

        if (!['pending', 'in-progress', 'completed', 'rejected', 'cancelled'].includes(status)) {
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
            // Generate Registration Number if not present
            if (!request.issuedDocument?.registrationNumber) {
                const year = new Date().getFullYear();
                const rand = Math.floor(10000 + Math.random() * 90000); // 5 digits
                updateData.issuedDocument = {
                    ...(request.issuedDocument || {}),
                    registrationNumber: `ORO-JMA-${year}-${rand}`,
                    issuedAt: new Date()
                };
            }
        }

        const requestUpdated = await Request.findByIdAndUpdate(id, updateData, { new: true })
            .populate('resident', 'username email');

        if (!requestUpdated) {
            return res.status(404).json({ error: 'Not Found', message: 'Request not found' });
        }

        // ── Bidirectional sync: cascade to linked Job ──
        if (requestUpdated.job) {
            const jobStatusMap = {
                'completed': 'completed',
                'rejected': 'cancelled',
                'in-progress': 'in-progress',
                'cancelled': 'cancelled',
            };
            const newJobStatus = jobStatusMap[status];
            if (newJobStatus) {
                const jobUpdate = { status: newJobStatus };
                if (newJobStatus === 'completed') jobUpdate.completedAt = new Date();
                if (rejectionReason) jobUpdate.completionNotes = `Rejected: ${rejectionReason}`;
                await Job.findByIdAndUpdate(request.job, jobUpdate);
            }
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
        if (assignedTo) request.assignedEmployee = assignedTo;
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
 * Delete request (admin only) - Hard delete
 */
const deleteRequest = async (req, res) => {
    try {
        const { id } = req.params;

        const request = await Request.findByIdAndDelete(id);
        if (!request) {
            return res.status(404).json({ error: 'Not Found', message: 'Request not found' });
        }

        // Also delete linked job if exists
        if (request.job) {
            await Job.findByIdAndDelete(request.job);
        }

        // Clean up orphaned Cloudinary attachments
        if (request.attachments && request.attachments.length > 0) {
            for (const att of request.attachments) {
                if (att.filename) {
                    try {
                        const fileDoc = await File.findOneAndDelete({ filename: att.filename });
                        if (fileDoc && fileDoc.url && fileDoc.url.includes('cloudinary')) {
                            // filename might be public_id for cloudinary or we might need to extract it
                            // cloudinary.uploader.destroy uses public_id. Multer-storage-cloudinary usually sets filename as public_id.
                            await cloudinary.uploader.destroy(fileDoc.filename);
                        }
                    } catch (attErr) {
                        logger.error(`Failed to delete attachment ${att.filename}:`, attErr);
                    }
                }
            }
        }

        res.json({ message: 'Request deleted successfully' });
    } catch (error) {
        logger.error('DeleteRequest error:', error);
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
};

/**
 * Soft delete a request (Admin/Resident)
 */
const softDeleteRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const request = await Request.findById(id);
        
        if (!request) {
            return res.status(404).json({ error: 'Not Found', message: 'Request not found' });
        }
        
        // Check authorization
        if (req.user.role !== 'admin' && request.resident.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Forbidden', message: 'Access denied' });
        }

        request.isDeleted = true;
        await request.save();

        res.json({ message: 'Request soft deleted successfully' });
    } catch (error) {
        logger.error('SoftDeleteRequest error:', error);
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
};

/**
 * Escalate request to admin (employee)
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

/**
 * Get request statistics for admin pipeline view
 */
const getRequestStats = async (req, res) => {
    try {
        const [total, pending, inProgress, completed, rejected, escalated] = await Promise.all([
            Request.countDocuments(),
            Request.countDocuments({ status: 'pending' }),
            Request.countDocuments({ status: 'in-progress' }),
            Request.countDocuments({ status: 'completed' }),
            Request.countDocuments({ status: 'rejected' }),
            Request.countDocuments({ isEscalated: true, status: { $nin: ['completed', 'rejected', 'cancelled'] } }),
        ]);

        // By category
        const byCategory = await Request.aggregate([
            { $group: { _id: '$categoryTag', count: { $sum: 1 }, pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } }, inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } } } },
            { $sort: { count: -1 } }
        ]);

        res.json({
            total,
            byStatus: { pending, inProgress, completed, rejected, escalated },
            byCategory,
        });
    } catch (error) {
        logger.error('GetRequestStats error:', error);
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
    softDeleteRequest,
    escalateRequest,
    getRequestStats
};
