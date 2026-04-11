/**
 * Staff authorization middleware - allows admin and special-employee roles
 * Must be used AFTER authMiddleware
 */
const staffAuth = (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required'
            });
        }

        if (req.user.role !== 'admin' && req.user.role !== 'special-employee') {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Staff access required (admin or special-employee)'
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

module.exports = staffAuth;
