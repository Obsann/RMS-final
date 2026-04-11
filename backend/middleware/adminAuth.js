/**
 * Admin authorization middleware - must be used AFTER authMiddleware
 * Checks if the authenticated user has admin privileges
 */
const adminAuth = (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required'
            });
        }

        if (req.user.role !== 'admin') {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Admin access required'
            });
        }

        next();
    } catch (error) {
        return res.status(500).json({
            error: 'Server Error',
            message: 'Authorization failed'
        });
    }
};

module.exports = adminAuth;
