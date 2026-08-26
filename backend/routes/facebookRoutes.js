const express = require('express');
const router = express.Router();
const facebookController = require('../controllers/facebookController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Facebook
 *   description: Facebook integration endpoints
 */

// Public routes
router.get('/pages', authMiddleware.protect, facebookController.getUserPages);
router.get('/groups', authMiddleware.protect, facebookController.getUserGroups);

// Post routes
router.post('/post', authMiddleware.protect, facebookController.createPost);
router.get('/posts', authMiddleware.protect, facebookController.getPagePosts);

// Message routes
router.get('/messages', authMiddleware.protect, facebookController.getPageMessages);
router.get('/messages/:conversationId', authMiddleware.protect, facebookController.getConversationMessages);
router.post('/send-message', authMiddleware.protect, facebookController.sendMessage);

// Insights
router.get('/insights', authMiddleware.protect, facebookController.getPageInsights);

// Webhook
router.get('/webhook', facebookController.verifyWebhook);
router.post('/webhook', facebookController.handleWebhook);

// Account connection
router.post('/connect', authMiddleware.protect, facebookController.connectFacebookAccount);
router.delete('/disconnect/:pageId', authMiddleware.protect, facebookController.disconnectFacebookPage);

// Search
router.get('/search', authMiddleware.protect, facebookController.search);

module.exports = router;
