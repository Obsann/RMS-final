const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware that checks express-validator results and returns 400 if any errors
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation Error',
            message: errors.array().map(e => e.msg).join(', '),
            details: errors.array()
        });
    }
    next();
};

// ── Auth Validators ──────────────────────────────────────────

const registerValidator = [
    body('username')
        .trim()
        .notEmpty().withMessage('Username is required')
        .isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please enter a valid email address')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone')
        .optional()
        .trim()
        .matches(/^[0-9+\-() ]{7,20}$/).withMessage('Please enter a valid phone number'),
    body('unit')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Unit must be less than 100 characters'),
    validate
];

const loginValidator = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please enter a valid email address')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required'),
    validate
];

const changePasswordValidator = [
    body('currentPassword')
        .notEmpty().withMessage('Current password is required'),
    body('newPassword')
        .notEmpty().withMessage('New password is required')
        .isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
    validate
];

const forgotPasswordValidator = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please enter a valid email address')
        .normalizeEmail(),
    validate
];

const resetPasswordValidator = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please enter a valid email address'),
    body('token')
        .notEmpty().withMessage('Reset token is required'),
    body('newPassword')
        .notEmpty().withMessage('New password is required')
        .isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
    validate
];

// ── Request Validators ───────────────────────────────────────

const createRequestValidator = [
    body('type')
        .trim()
        .notEmpty().withMessage('Request type is required')
        .isIn(['maintenance', 'complaint', 'certificate', 'id_renewal', 'identity', 'permit', 'address_confirmation', 'property_transfer', 'business_license', 'general_inquiry']).withMessage('Invalid request type'),
    body('category')
        .trim()
        .notEmpty().withMessage('Category is required'),
    body('subject')
        .trim()
        .notEmpty().withMessage('Subject is required')
        .isLength({ max: 200 }).withMessage('Subject must be less than 200 characters'),
    body('description')
        .trim()
        .notEmpty().withMessage('Description is required')
        .isLength({ max: 2000 }).withMessage('Description must be less than 2000 characters'),
    body('priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority level'),
    body('serviceType')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Service type must be less than 100 characters'),
    body('categoryTag')
        .optional()
        .isIn(['ID_REGISTRATION', 'CERTIFICATES', 'PERMITS', 'FEEDBACK_SUPPORT']).withMessage('Invalid category tag'),
    body('formData')
        .optional(),
    validate
];

const updateRequestStatusValidator = [
    body('status')
        .notEmpty().withMessage('Status is required')
        .isIn(['pending', 'in-progress', 'completed', 'cancelled']).withMessage('Invalid status'),
    body('response')
        .optional()
        .trim()
        .isLength({ max: 2000 }).withMessage('Response must be less than 2000 characters'),
    validate
];

// ── Job Validators ───────────────────────────────────────────

const createJobValidator = [
    body('title')
        .trim()
        .notEmpty().withMessage('Job title is required')
        .isLength({ max: 200 }).withMessage('Title must be less than 200 characters'),
    body('description')
        .trim()
        .notEmpty().withMessage('Description is required'),
    body('category')
        .trim()
        .notEmpty().withMessage('Category is required')
        .isIn(['Identity & Registration', 'Certificates', 'Permits', 'Feedback & Support', 'Other']).withMessage('Invalid job category'),
    body('priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority level'),
    validate
];

// ── Household Validators ─────────────────────────────────────

const createHouseholdValidator = [
    body('houseNo')
        .trim()
        .notEmpty().withMessage('House number is required'),
    body('headOfHousehold')
        .notEmpty().withMessage('Head of household is required')
        .isMongoId().withMessage('Invalid head of household ID'),
    body('address.kebele')
        .optional()
        .trim(),
    body('address.woreda')
        .optional()
        .trim(),
    body('type')
        .optional()
        .isIn(['residential', 'commercial', 'mixed']).withMessage('Invalid household type'),
    validate
];

// ── Notification Validators ──────────────────────────────────

const announcementValidator = [
    body('title')
        .trim()
        .notEmpty().withMessage('Title is required')
        .isLength({ max: 200 }).withMessage('Title must be less than 200 characters'),
    body('message')
        .trim()
        .notEmpty().withMessage('Message is required')
        .isLength({ max: 1000 }).withMessage('Message must be less than 1000 characters'),
    body('targetRole')
        .optional()
        .isIn(['resident', 'employee', 'admin']).withMessage('Invalid target role'),
    validate
];

// ── Common Validators ────────────────────────────────────────

const mongoIdParam = [
    param('id')
        .isMongoId().withMessage('Invalid ID format'),
    validate
];

const paginationQuery = [
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    validate
];

module.exports = {
    validate,
    registerValidator,
    loginValidator,
    changePasswordValidator,
    forgotPasswordValidator,
    resetPasswordValidator,
    createRequestValidator,
    updateRequestStatusValidator,
    createJobValidator,
    createHouseholdValidator,
    announcementValidator,
    mongoIdParam,
    paginationQuery
};
