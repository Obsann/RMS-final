/**
 * Employee authorization middleware - must be used AFTER authMiddleware
 * Checks if the authenticated user is an employee or admin
 */
const employeeAuth = (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required'
            });
        }

        const allowedRoles = ['employee', 'special-employee', 'admin'];

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Employee access required'
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

module.exports = employeeAuth;
