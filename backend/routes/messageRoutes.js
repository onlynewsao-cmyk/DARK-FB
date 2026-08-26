const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Message management endpoints
 */

// Get all messages
router.get('/', authMiddleware.protect, messageController.getAllMessages);

// Get unread count
router.get('/unread', authMiddleware.protect, messageController.getUnreadCount);

// Get single message
router.get('/:id', authMiddleware.protect, messageController.getMessage);

// Reply to message
router.post('/:id/reply', authMiddleware.protect, messageController.replyToMessage);

// Mark as read
router.post('/:id/mark-read', authMiddleware.protect, messageController.markAsRead);

// Archive message
router.post('/:id/archive', authMiddleware.protect, messageController.archiveMessage);

// Add tags
router.post('/:id/tags', authMiddleware.protect, messageController.addTags);

// Get conversation
router.get('/conversations/:senderId', authMiddleware.protect, messageController.getConversation);

// Search messages
router.get('/search', authMiddleware.protect, messageController.searchMessages);

// Export messages
router.get('/export', authMiddleware.protect, messageController.exportMessages);

module.exports = router;
