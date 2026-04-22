/**
 * Role-based authorization middleware
 */

const roleAuth = (allowedRoles) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Authentication required'
                });
            }

            if (!allowedRoles.includes(req.user.role)) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'Insufficient permissions'
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
};

/**
 * Data access middleware - restricts users to their own data
 */
const dataAccess = (resourceRole = null) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Authentication required'
                });
            }

            // Admins can access everything
            if (req.user.role === 'admin') {
                return next();
            }

            // Employees can only access employee-related data
            if (req.user.role === 'employee') {
                // For user data access, employees can only see their own profile
                if (req.params.id && req.params.id !== req.user.id) {
                    return res.status(403).json({
                        error: 'Forbidden',
                        message: 'Employees can only access their own profile'
                    });
                }
                
                // If querying for users, restrict to employee role data
                if (req.query.role && req.query.role !== 'employee') {
                    return res.status(403).json({
                        error: 'Forbidden',
                        message: 'Employees can only view other employees'
                    });
                }
            }

            // Residents can only access their own data
            if (req.user.role === 'resident') {
                if (req.params.id && req.params.id !== req.user.id) {
                    return res.status(403).json({
                        error: 'Forbidden',
                        message: 'Residents can only access their own profile'
                    });
                }
            }

            next();
        } catch (error) {
            return res.status(500).json({
                error: 'Server Error',
                message: 'Data access check failed'
            });
        }
    };
};

module.exports = { roleAuth, dataAccess };