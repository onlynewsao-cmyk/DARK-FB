const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { createLimiters } = require('../config/rateLimiter');

class AuthMiddleware {
  constructor() {
    this.limiters = null;
    this.init();
  }

  async init() {
    this.limiters = await createLimiters();
  }

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

  /**
   * Apply rate limiting to routes
   */
  applyRateLimiting(limiters = []) {
    return (req, res, next) => {
      const limiter = limiters.find(l => 
        req.path.includes(l.name) || l.applyToPath?.(req.path)
      );
      
      if (limiter) {
        return limiter(req, res, next);
      }
      
      // Apply default rate limiting
      if (this.limiters?.generalApi) {
        return this.limiters.generalApi(req, res, next);
      }
      
      next();
    };
  }

  /**
   * Check if user has reached post limit
   */
  async checkPostLimit(req, res, next) {
    try {
      const user = await User.findById(req.user._id);
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      // Count posts in last hour
      const Post = require('../models/Post');
      const postCount = await Post.countDocuments({
        'user.id': user._id,
        createdAt: { $gte: oneHourAgo }
      });
      
      const maxPosts = user.antiBan?.maxPostsPerHour || 50;
      
      if (postCount >= maxPosts) {
        return res.status(429).json({
          error: `Post limit reached (${maxPosts} posts/hour). Please wait before posting more.`
        });
      }
      
      next();
    } catch (error) {
      next(); // If error, allow the request to proceed
    }
  }

  /**
   * Check if user has reached message limit
   */
  async checkMessageLimit(req, res, next) {
    try {
      const user = await User.findById(req.user._id);
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
      
      // Count messages in last minute
      const Message = require('../models/Message');
      const messageCount = await Message.countDocuments({
        senderId: user._id.toString(),
        createdAt: { $gte: oneMinuteAgo }
      });
      
      const maxMessages = user.antiBan?.maxMessagesPerMinute || 20;
      
      if (messageCount >= maxMessages) {
        return res.status(429).json({
          error: `Message limit reached (${maxMessages} messages/minute). Please wait before sending more.`
        });
      }
      
      next();
    } catch (error) {
      next(); // If error, allow the request to proceed
    }
  }

  /**
   * Check if user email is verified
   */
  requireEmailVerification(req, res, next) {
    if (!req.user.isVerified) {
      return res.status(403).json({
        error: 'Please verify your email address before accessing this feature'
      });
    }
    next();
  }

  /**
   * Check if user has connected at least one Facebook account
   */
  async requireFacebookAccount(req, res, next) {
    try {
      const user = await User.findById(req.user._id);
      
      if (user.facebookAccounts.length === 0 && !user.facebook?.id) {
        return res.status(403).json({
          error: 'Please connect at least one Facebook account to use this feature'
        });
      }
      
      next();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new AuthMiddleware();
