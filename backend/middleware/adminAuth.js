const auth = require('./auth');

const adminAuth = async (req, res, next) => {
  // First run the regular auth middleware
  auth(req, res, (err) => {
    if (err) {
      return next(err);
    }

    // Check if user is admin (role 1)
    if (req.user.role !== 1) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // User is authenticated and is admin
    next();
  });
};

module.exports = adminAuth;
