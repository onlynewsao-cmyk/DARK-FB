const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

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

// Protected routes
router.get('/me', authMiddleware.protect, authController.getMe);
router.post('/refresh', authMiddleware.protect, authController.refreshToken);
router.post('/change-password', authMiddleware.protect, authController.changePassword);
router.post('/logout', authMiddleware.protect, authController.logout);

module.exports = router;
