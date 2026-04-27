/**
 * Simple in-memory rate limiter for authentication endpoints
 * In production, use Redis-backed rate limiting for distributed systems
 */

const rateLimit = new Map();

/**
 * Creates a rate limiting middleware
 * @param {number} windowMs - Time window in milliseconds
 * @param {number} maxRequests - Maximum requests allowed in window
 * @param {string} message - Error message to return
 * @param {object} options - Additional options like countOnlyOnFail
 */
const createRateLimiter = (windowMs = 15 * 60 * 1000, maxRequests = 20, message = 'Too many requests', options = {}) => {
    return (req, res, next) => {
        if (process.env.NODE_ENV === 'test') {
            return next();
        }

        const key = req.ip || req.connection.remoteAddress || 'unknown';
        const now = Date.now();

        // Clean up old entries
        const userRateData = rateLimit.get(key);

        if (!userRateData || now - userRateData.windowStart > windowMs) {
            // New window — don't count yet if countOnlyOnFail
            rateLimit.set(key, {
                windowStart: now,
                count: options.countOnlyOnFail ? 0 : 1
            });
            if (!options.countOnlyOnFail) return next();
        }

        if (userRateData && userRateData.count >= maxRequests) {
            const retryAfter = Math.ceil((userRateData.windowStart + windowMs - now) / 1000);
            res.set('Retry-After', retryAfter);
            return res.status(429).json({
                error: 'Too Many Requests',
                message: message,
                retryAfter: retryAfter
            });
        }

        if (!options.countOnlyOnFail) {
            userRateData.count++;
            rateLimit.set(key, userRateData);
        } else {
            // Only count the request AFTER we know it failed
            res.on('finish', () => {
                if (res.statusCode < 200 || res.statusCode >= 300) {
                    const currentData = rateLimit.get(key);
                    if (currentData) {
                        currentData.count++;
                        rateLimit.set(key, currentData);
                    }
                }
            });
        }

        next();
    };
};

// Pre-configured limiters for common use cases
const authLimiter = createRateLimiter(
    5 * 60 * 1000,   // 5 minutes window
    20,              // 20 failed attempts before lockout
    'Too many failed login attempts. Please try again in 5 minutes.',
    { countOnlyOnFail: true }
);

const registerLimiter = createRateLimiter(
    60 * 60 * 1000, // 1 hour
    10,              // 10 registration attempts per hour
    'Too many registration attempts. Please try again later.'
);

const apiLimiter = createRateLimiter(
    60 * 1000,       // 1 minute
    100,             // 100 requests
    'Too many requests. Please slow down.'
);

module.exports = {
    createRateLimiter,
    authLimiter,
    registerLimiter,
    apiLimiter
};
