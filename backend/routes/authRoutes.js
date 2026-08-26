const express = require('express');
const router = express.Router();
const passport = require('passport');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { generateState } = require('../config/passport');

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication endpoints
 */

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// OAuth Routes
/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Initiate Google OAuth login
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirect to Google
 */
router.get('/google', (req, res, next) => {
  const state = generateState();
  req.session.oauthState = state;
  
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state: state,
    session: false
  })(req, res, next);
});

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirect with token
 */
router.get('/google/callback', 
  passport.authenticate('google', { 
    session: false, 
    failureRedirect: '/login' 
  }),
  (req, res) => {
    // Token is in req.user.token from passport
    const token = req.user?.token || req.authInfo?.token;
    
    if (token) {
      // Redirect to frontend with token
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?token=${token}`);
    } else {
      res.redirect('/login');
    }
  }
);

/**
 * @swagger
 * /api/auth/facebook:
 *   get:
 *     summary: Initiate Facebook OAuth login
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirect to Facebook
 */
router.get('/facebook', (req, res, next) => {
  const state = generateState();
  req.session.oauthState = state;
  
  passport.authenticate('facebook', {
    scope: ['email', 'public_profile'],
    state: state,
    session: false
  })(req, res, next);
});

/**
 * @swagger
 * /api/auth/facebook/callback:
 *   get:
 *     summary: Facebook OAuth callback
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirect with token
 */
router.get('/facebook/callback',
  passport.authenticate('facebook', { 
    session: false, 
    failureRedirect: '/login' 
  }),
  (req, res) => {
    const token = req.user?.token || req.authInfo?.token;
    
    if (token) {
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?token=${token}`);
    } else {
      res.redirect('/login');
    }
  }
);

/**
 * @swagger
 * /api/auth/github:
 *   get:
 *     summary: Initiate GitHub OAuth login
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirect to GitHub
 */
router.get('/github', (req, res, next) => {
  const state = generateState();
  req.session.oauthState = state;
  
  passport.authenticate('github', {
    scope: ['user:email', 'user:profile'],
    state: state,
    session: false
  })(req, res, next);
});

/**
 * @swagger
 * /api/auth/github/callback:
 *   get:
 *     summary: GitHub OAuth callback
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirect with token
 */
router.get('/github/callback',
  passport.authenticate('github', { 
    session: false, 
    failureRedirect: '/login' 
  }),
  (req, res) => {
    const token = req.user?.token || req.authInfo?.token;
    
    if (token) {
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?token=${token}`);
    } else {
      res.redirect('/login');
    }
  }
);

// Protected routes
router.get('/me', authMiddleware.protect, authController.getMe);
router.post('/refresh', authMiddleware.protect, authController.refreshToken);
router.post('/change-password', authMiddleware.protect, authController.changePassword);
router.post('/logout', authMiddleware.protect, authController.logout);

// Settings routes
router.get('/settings', authMiddleware.protect, authController.getSettings);
router.put('/settings', authMiddleware.protect, authController.updateSettings);

// Provider connection routes
router.post('/connect/google', authMiddleware.protect, authController.connectGoogle);
router.post('/connect/facebook', authMiddleware.protect, authController.connectFacebook);
router.post('/connect/github', authMiddleware.protect, authController.connectGitHub);

// Provider disconnection routes
router.post('/disconnect/google', authMiddleware.protect, authController.disconnectGoogle);
router.post('/disconnect/facebook', authMiddleware.protect, authController.disconnectFacebook);
router.post('/disconnect/github', authMiddleware.protect, authController.disconnectGitHub);

// OAuth state verification middleware
function verifyState(req, res, next) {
  if (req.query.state !== req.session.oauthState) {
    return res.status(403).json({ error: 'Invalid state parameter' });
  }
  next();
}

module.exports = router;
