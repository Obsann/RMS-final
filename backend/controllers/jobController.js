const logger = require('../config/logger');
const Job = require('../models/Job');
const User = require('../models/authmodel');

/**
 * Auto-assign a job to the least-loaded employee matching the job's category
 */
const autoAssignJob = async (category, excludeId = null) => {
    try {
        // Find approved employees matching category (case-insensitive)
        const matchQuery = {
            role: 'employee',
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
            if (!employee || employee.role !== 'employee') {
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
                .populate({
                    path: 'sourceRequest',
                    select: 'type subject description category categoryTag serviceType formData attachments status priority resident unit response isEscalated createdAt',
                    populate: { path: 'resident', select: 'username email unit phone' }
                })
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

        // ── Backend Logic: Enforce Fake Credential Check Before Completion ──
        if (status === 'completed' && job.sourceRequest) {
            const Request = require('../models/Request');
            const User = require('../models/authmodel');
            const sourceReq = await Request.findById(job.sourceRequest);
            if (sourceReq && sourceReq.resident) {
                const resident = await User.findById(sourceReq.resident);
                if (resident) {
                    const isHermata = resident.address?.toLowerCase().includes('hermata merkato') || resident.address?.toLowerCase().includes('hermata');
                    const hasHMKId = resident.nationalId?.toUpperCase().startsWith('HMK');
                    if (!isHermata && !hasHMKId && !resident.idCardPhoto) {
                        return res.status(400).json({ 
                            error: 'Verification Required', 
                            message: 'Cannot approve: Resident address/ID is outside Hermata Merkato Kebele and no ID Card Photo was uploaded for verification.' 
                        });
                    }
                }
            }
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

        // ── Bidirectional sync: cascade to linked Request ──
        if (job.sourceRequest && status) {
            const Request = require('../models/Request');
            const requestStatusMap = {
                'completed': 'completed',
                'cancelled': 'cancelled',
                'in-progress': 'in-progress',
                'assigned': 'in-progress',
            };
            const newRequestStatus = requestStatusMap[status];
            if (newRequestStatus) {
                const reqUpdate = { status: newRequestStatus };
                if (newRequestStatus === 'completed') reqUpdate.resolvedAt = new Date();
                
                const updatedReq = await Request.findByIdAndUpdate(job.sourceRequest, reqUpdate, { new: true });
                
                // ── Auto-issue Digital ID when 'New ID Application' is approved ──
                if (newRequestStatus === 'completed' && updatedReq && updatedReq.type === 'identity' && updatedReq.serviceType === 'New ID Application') {
                    const DigitalId = require('../models/DigitalId');
                    const User = require('../models/authmodel');
                    
                    let digitalId = await DigitalId.findOne({ user: updatedReq.resident });
                    const expiresAt = new Date();
                    expiresAt.setFullYear(expiresAt.getFullYear() + 10); // 10-year validity per Proclamation 1284/2023

                    // Extract biographical data from the request's formData
                    const fd = updatedReq.formData || {};

                    if (!digitalId) {
                        // Generate 12-digit ID Number: HMK-YYYY-NNNNN
                        const count = await DigitalId.countDocuments();
                        const idNumber = `HMK-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
                        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
                        const qrVerifyUrl = `${baseUrl}/verify/${idNumber}`;
                        
                        digitalId = await DigitalId.create({
                            user: updatedReq.resident,
                            idNumber,
                            qrCode: qrVerifyUrl,
                            issuedAt: new Date(),
                            expiresAt,
                            status: 'issued',
                            approvedBy: req.user.id,
                            approvedAt: new Date(),
                            // Biographical snapshot from form
                            firstName: fd.firstName || '',
                            fatherName: fd.fatherName || '',
                            grandfatherName: fd.grandfatherName || '',
                            firstNameAmharic: fd.firstNameAmharic || '',
                            fatherNameAmharic: fd.fatherNameAmharic || '',
                            grandfatherNameAmharic: fd.grandfatherNameAmharic || '',
                            dateOfBirth: fd.dateOfBirth ? new Date(fd.dateOfBirth) : null,
                            gender: fd.gender || null,
                            nationality: fd.nationality || 'Ethiopian',
                            placeOfBirth: fd.placeOfBirth || '',
                            bloodType: fd.bloodType || null,
                            occupation: fd.occupation || '',
                            educationLevel: fd.educationLevel || '',
                            maritalStatus: fd.maritalStatus || '',
                            motherName: fd.motherName || '',
                            houseNumber: fd.houseNumber || '',
                            phone: fd.phone || '',
                            emergencyContact: {
                                name: fd.emergencyContactName || '',
                                phone: fd.emergencyContactPhone || ''
                            },
                            issuingAuthority: 'Hermata Merkato Kebele',
                            verifications: [{
                                verifiedBy: req.user.id,
                                verifiedAt: new Date(),
                                method: 'manual'
                            }]
                        });
                    } else {
                        // Update existing record
                        digitalId.status = 'issued';
                        digitalId.issuedAt = new Date();
                        digitalId.expiresAt = expiresAt;
                        digitalId.approvedBy = req.user.id;
                        digitalId.approvedAt = new Date();
                        // Update biographical fields
                        Object.assign(digitalId, {
                            firstName: fd.firstName || digitalId.firstName,
                            fatherName: fd.fatherName || digitalId.fatherName,
                            grandfatherName: fd.grandfatherName || digitalId.grandfatherName,
                            firstNameAmharic: fd.firstNameAmharic || digitalId.firstNameAmharic,
                            fatherNameAmharic: fd.fatherNameAmharic || digitalId.fatherNameAmharic,
                            grandfatherNameAmharic: fd.grandfatherNameAmharic || digitalId.grandfatherNameAmharic,
                            dateOfBirth: fd.dateOfBirth ? new Date(fd.dateOfBirth) : digitalId.dateOfBirth,
                            gender: fd.gender || digitalId.gender,
                            nationality: fd.nationality || digitalId.nationality,
                            placeOfBirth: fd.placeOfBirth || digitalId.placeOfBirth,
                            bloodType: fd.bloodType || digitalId.bloodType,
                            occupation: fd.occupation || digitalId.occupation,
                            educationLevel: fd.educationLevel || digitalId.educationLevel,
                            maritalStatus: fd.maritalStatus || digitalId.maritalStatus,
                            motherName: fd.motherName || digitalId.motherName,
                            houseNumber: fd.houseNumber || digitalId.houseNumber,
                            phone: fd.phone || digitalId.phone,
                            emergencyContact: {
                                name: fd.emergencyContactName || digitalId.emergencyContact?.name,
                                phone: fd.emergencyContactPhone || digitalId.emergencyContact?.phone
                            },
                        });
                        await digitalId.save();
                    }

                    // Update user model cache + passport photo as profile photo
                    const userUpdate = {
                        'digitalId.status': 'issued',
                        'digitalId.issuedAt': digitalId.issuedAt,
                        'digitalId.expiresAt': digitalId.expiresAt
                    };

                    // If a passport photo was uploaded with the application, set it as profile photo
                    if (updatedReq.attachments && updatedReq.attachments.length > 0) {
                        const photoAttachment = updatedReq.attachments.find(a =>
                            a.originalName && /\.(jpg|jpeg|png|webp)$/i.test(a.originalName)
                        );
                        if (photoAttachment) {
                            userUpdate.profilePhoto = photoAttachment.filename;
                            digitalId.passportPhoto = photoAttachment.filename;
                            await digitalId.save();
                        }
                    }

                    await User.findByIdAndUpdate(updatedReq.resident, userUpdate);
                }

                // ── Fetch approving employee's name for signature watermark ──
                const approvingEmployee = await User.findById(req.user.id).select('username');
                const employeeSignature = approvingEmployee?.username || 'Authorized Officer';

                // ── Auto-issue Certificate when certificate request is approved ──
                if (newRequestStatus === 'completed' && updatedReq && updatedReq.type === 'certificate' && !updatedReq.issuedDocument?.documentNumber) {
                    const fd = updatedReq.formData || {};
                    const serviceType = updatedReq.serviceType || '';
                    
                    // Determine certificate type code
                    let typeCode = 'GEN';
                    if (serviceType.includes('Birth')) typeCode = 'BIRTH';
                    else if (serviceType.includes('Marriage')) typeCode = 'MARRIAGE';
                    else if (serviceType.includes('Death')) typeCode = 'DEATH';
                    else if (serviceType.includes('Divorce')) typeCode = 'DIVORCE';

                    // Generate unique document number
                    const Request = require('../models/Request');
                    const certCount = await Request.countDocuments({
                        type: 'certificate',
                        'issuedDocument.documentNumber': { $exists: true, $ne: null }
                    });
                    const documentNumber = `HMK-CERT-${typeCode}-${new Date().getFullYear()}-${String(certCount + 1).padStart(5, '0')}`;
                    const registrationNumber = `REG-${typeCode}-${String(certCount + 1).padStart(6, '0')}`;

                    await Request.findByIdAndUpdate(updatedReq._id, {
                        issuedDocument: {
                            documentNumber,
                            documentType: updatedReq.serviceType || 'Certificate',
                            issuedAt: new Date(),
                            issuedBy: req.user.id,
                            expiresAt: null,
                            isLegalized: true,
                            signatoryName: employeeSignature,
                            signatoryTitle: 'Authorized Officer — Hermata Merkato Kebele',
                            registrationNumber,
                            formSnapshot: { ...fd },
                        }
                    });
                    logger.info(`Certificate issued: ${documentNumber} for request ${updatedReq._id}`);
                }

                // ── Auto-issue Permit when permit request is approved ──
                if (newRequestStatus === 'completed' && updatedReq && updatedReq.type === 'permit' && !updatedReq.issuedDocument?.documentNumber) {
                    const fd = updatedReq.formData || {};
                    const serviceType = updatedReq.serviceType || '';
                    
                    let typeCode = 'GEN';
                    if (serviceType.includes('Construction')) typeCode = 'CONST';
                    else if (serviceType.includes('Business')) typeCode = 'BIZ';
                    else if (serviceType.includes('Event')) typeCode = 'EVENT';

                    const Request = require('../models/Request');
                    const permitCount = await Request.countDocuments({
                        type: 'permit',
                        'issuedDocument.documentNumber': { $exists: true, $ne: null }
                    });
                    const documentNumber = `HMK-PRMT-${typeCode}-${new Date().getFullYear()}-${String(permitCount + 1).padStart(5, '0')}`;

                    const expiresAt = new Date();
                    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

                    await Request.findByIdAndUpdate(updatedReq._id, {
                        issuedDocument: {
                            documentNumber,
                            documentType: updatedReq.serviceType || 'Permit',
                            issuedAt: new Date(),
                            issuedBy: req.user.id,
                            expiresAt,
                            isLegalized: true,
                            signatoryName: employeeSignature,
                            signatoryTitle: 'Authorized Officer — Hermata Merkato Kebele',
                            registrationNumber: null,
                            formSnapshot: { ...fd },
                        }
                    });
                    logger.info(`Permit issued: ${documentNumber} for request ${updatedReq._id}`);
                }
            }
        }

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
        if (!employee || employee.role !== 'employee') {
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
    getJobStats,
    autoAssignJob
};
