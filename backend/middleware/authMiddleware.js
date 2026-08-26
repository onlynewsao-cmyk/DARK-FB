const jwt = require('jsonwebtoken');
const User = require('../models/User');

class AuthMiddleware {
  /**
   * Protect routes - require authentication
   */
  async protect(req, res, next) {
    try {
      let token;
      
      // Check for token in headers
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
      }
      
      // Check for token in cookies
      if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
      }
      
      if (!token) {
        return res.status(401).json({
          error: 'Not authorized, no token provided'
        });
      }
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from token
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({
          error: 'Not authorized, user not found'
        });
      }
      
      // Check if user is active
      if (!user.isActive) {
        return res.status(403).json({
          error: 'Account is disabled'
        });
      }
      
      // Attach user to request
      req.user = user;
      
      // Update last login
      user.lastLogin = new Date();
      await user.save();
      
      next();
    } catch (error) {
      console.error('Auth error:', error);
      return res.status(401).json({
        error: 'Not authorized, token failed'
      });
    }
  }

  /**
   * Authorize roles - require specific roles
   */
  authorize(...roles) {
    return (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          error: `User role (${req.user.role}) is not authorized to access this route`
        });
      }
      next();
    };
  }

  /**
   * Check if user has a specific Facebook page connected
   */
  async checkFacebookPage(pageId) {
    return async (req, res, next) => {
      try {
        const user = await User.findById(req.user._id);
        const hasPage = user.facebookAccounts.some(acc => acc.pageId === pageId);
        
        if (!hasPage) {
          return res.status(403).json({
            error: 'You do not have access to this Facebook page'
          });
        }
        
        // Attach the page info to request
        const page = user.facebookAccounts.find(acc => acc.pageId === pageId);
        req.facebookPage = page;
        
        next();
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    };
  }
}

module.exports = new AuthMiddleware();
