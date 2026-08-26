const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Analytics and reporting endpoints
 */

// Get overview
router.get('/overview', authMiddleware.protect, analyticsController.getOverview);

// Get post analytics
router.get('/posts', authMiddleware.protect, analyticsController.getPostAnalytics);

// Get message analytics
router.get('/messages', authMiddleware.protect, analyticsController.getMessageAnalytics);

// Get engagement analytics
router.get('/engagement', authMiddleware.protect, analyticsController.getEngagementAnalytics);

// Export analytics
router.get('/export', authMiddleware.protect, analyticsController.exportAnalytics);

module.exports = router;
