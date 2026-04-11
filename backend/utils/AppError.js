/**
 * Custom error classes for consistent error handling
 */

class AppError extends Error {
    constructor(message, statusCode = 500, errorType = 'Server Error') {
        super(message);
        this.statusCode = statusCode;
        this.errorType = errorType;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404, 'Not Found');
    }
}

class ValidationError extends AppError {
    constructor(message = 'Validation failed') {
        super(message, 400, 'Validation Error');
    }
}

class UnauthorizedError extends AppError {
    constructor(message = 'Authentication required') {
        super(message, 401, 'Unauthorized');
    }
}

class ForbiddenError extends AppError {
    constructor(message = 'Access denied') {
        super(message, 403, 'Forbidden');
    }
}

class ConflictError extends AppError {
    constructor(message = 'Resource already exists') {
        super(message, 409, 'Conflict');
    }
}

module.exports = {
    AppError,
    NotFoundError,
    ValidationError,
    UnauthorizedError,
    ForbiddenError,
    ConflictError
};
