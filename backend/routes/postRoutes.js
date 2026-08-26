const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Posts
 *   description: Post management endpoints
 */

// Get all posts
router.get('/', authMiddleware.protect, postController.getAllPosts);

// Create post (draft)
router.post('/', authMiddleware.protect, postController.createPost);

// Get single post
router.get('/:id', authMiddleware.protect, postController.getPost);

// Update post
router.put('/:id', authMiddleware.protect, postController.updatePost);

// Publish post
router.post('/:id/publish', authMiddleware.protect, postController.publishPost);

// Delete post
router.delete('/:id', authMiddleware.protect, postController.deletePost);

// Schedule post
router.post('/:id/schedule', authMiddleware.protect, postController.schedulePost);

// Cancel schedule
router.post('/:id/cancel-schedule', authMiddleware.protect, postController.cancelSchedule);

// Get post stats
router.get('/:id/stats', authMiddleware.protect, postController.getPostStats);

// Export posts
router.get('/export', authMiddleware.protect, postController.exportPosts);

module.exports = router;
