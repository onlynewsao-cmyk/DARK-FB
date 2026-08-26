const express = require('express');
const router = express.Router();
const scheduledController = require('../controllers/scheduledController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Scheduled
 *   description: Scheduled post management endpoints
 */

// Get all scheduled posts
router.get('/', authMiddleware.protect, scheduledController.getAllScheduledPosts);

// Get upcoming posts
router.get('/upcoming', authMiddleware.protect, scheduledController.getUpcomingPosts);

// Get single scheduled post
router.get('/:id', authMiddleware.protect, scheduledController.getScheduledPost);

// Update scheduled post
router.put('/:id', authMiddleware.protect, scheduledController.updateScheduledPost);

// Cancel scheduled post
router.post('/:id/cancel', authMiddleware.protect, scheduledController.cancelScheduledPost);

// Publish now
router.post('/:id/publish-now', authMiddleware.protect, scheduledController.publishNow);

// Cleanup old posts
router.post('/cleanup', authMiddleware.protect, scheduledController.cleanupOldPosts);

module.exports = router;
