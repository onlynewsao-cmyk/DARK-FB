const Message = require('../models/Message');
const FacebookService = require('../services/facebookService');
const Analytics = require('../models/Analytics');

class MessageController {
  constructor() {
    this.facebookService = new FacebookService(process.env.FACEBOOK_ACCESS_TOKEN);
  }

  /**
   * @swagger
   * /api/messages:
   *   get:
   *     summary: Get all messages
   *     tags: [Messages]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: pageId
   *         schema:
   *           type: string
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [new, read, replied, archived]
   *       - in: query
   *         name: isRead
   *         schema:
   *           type: boolean
   *       - in: query
   *         name: page
   *         schema:
   *           type: number
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: number
   *           default: 10
   *     responses:
   *       200:
   *         description: List of messages
   */
  async getAllMessages(req, res) {
    try {
      const { pageId, status, isRead, page = 1, limit = 10 } = req.query;
      
      const query = {};
      
      // Filter by user's pages
      const user = await User.findById(req.user._id);
      const userPageIds = user.facebookAccounts.map(acc => acc.pageId);
      query.pageId = { $in: userPageIds };
      
      if (pageId) query.pageId = pageId;
      if (status) query.status = status;
      if (isRead) query.isRead = isRead === 'true';
      
      const messages = await Message.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));
      
      const total = await Message.countDocuments(query);
      
      res.json({
        messages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/messages/unread:
   *   get:
   *     summary: Get unread messages count
   *     tags: [Messages]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: pageId
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Unread count
   */
  async getUnreadCount(req, res) {
    try {
      const { pageId } = req.query;
      
      const user = await User.findById(req.user._id);
      const userPageIds = user.facebookAccounts.map(acc => acc.pageId);
      
      const query = {
        pageId: pageId ? pageId : { $in: userPageIds },
        isRead: false
      };
      
      const count = await Message.countDocuments(query);
      
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/messages/{id}:
   *   get:
   *     summary: Get a single message
   *     tags: [Messages]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Message data
   */
  async getMessage(req, res) {
    try {
      const { id } = req.params;
      
      const message = await Message.findById(id);
      
      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }
      
      // Check if user has access to this page
      const user = await User.findById(req.user._id);
      const hasAccess = user.facebookAccounts.some(
        acc => acc.pageId === message.pageId
      );
      
      if (!hasAccess) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      
      res.json(message);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/messages/{id}/reply:
   *   post:
   *     summary: Reply to a message
   *     tags: [Messages]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - message
   *             properties:
   *               message:
   *                 type: string
   *               imageUrl:
   *                 type: string
   *     responses:
   *       200:
   *         description: Reply sent
   */
  async replyToMessage(req, res) {
    try {
      const { id } = req.params;
      const { message: replyMessage, imageUrl } = req.body;
      
      const originalMessage = await Message.findById(id);
      
      if (!originalMessage) {
        return res.status(404).json({ error: 'Message not found' });
      }
      
      // Check if user has access
      const user = await User.findById(req.user._id);
      const facebookAccount = user.facebookAccounts.find(
        acc => acc.pageId === originalMessage.pageId
      );
      
      if (!facebookAccount) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      
      // Send reply via Facebook
      const service = new FacebookService(facebookAccount.pageAccessToken || facebookAccount.accessToken);
      
      let fbResponse;
      if (imageUrl) {
        fbResponse = await service.sendMessageWithImage(
          originalMessage.pageId,
          originalMessage.senderId,
          replyMessage,
          imageUrl
        );
      } else {
        fbResponse = await service.sendMessage(
          originalMessage.pageId,
          originalMessage.senderId,
          replyMessage
        );
      }
      
      // Update original message
      originalMessage.isReplied = true;
      originalMessage.replyContent = replyMessage;
      originalMessage.replyTimestamp = new Date();
      originalMessage.status = 'replied';
      await originalMessage.save();
      
      // Update analytics
      await Analytics.updateAnalytics(originalMessage.pageId, originalMessage.pageName || 'Unknown', {
        metrics: { messagesReplied: 1 }
      });
      
      res.json({
        message: 'Reply sent successfully',
        fbResponse
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/messages/{id}/mark-read:
   *   post:
   *     summary: Mark message as read
   *     tags: [Messages]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Message marked as read
   */
  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      
      const message = await Message.findById(id);
      
      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }
      
      // Check if user has access
      const user = await User.findById(req.user._id);
      const hasAccess = user.facebookAccounts.some(
        acc => acc.pageId === message.pageId
      );
      
      if (!hasAccess) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      
      await message.markAsRead();
      
      res.json({
        message: 'Message marked as read',
        message
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/messages/{id}/archive:
   *   post:
   *     summary: Archive a message
   *     tags: [Messages]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Message archived
   */
  async archiveMessage(req, res) {
    try {
      const { id } = req.params;
      
      const message = await Message.findById(id);
      
      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }
      
      // Check if user has access
      const user = await User.findById(req.user._id);
      const hasAccess = user.facebookAccounts.some(
        acc => acc.pageId === message.pageId
      );
      
      if (!hasAccess) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      
      await message.archive();
      
      res.json({
        message: 'Message archived',
        message
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/messages/{id}/tags:
   *   post:
   *     summary: Add tags to a message
   *     tags: [Messages]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - tags
   *             properties:
   *               tags:
   *                 type: array
   *                 items:
   *                   type: string
   *     responses:
   *       200:
   *         description: Tags added
   */
  async addTags(req, res) {
    try {
      const { id } = req.params;
      const { tags } = req.body;
      
      const message = await Message.findById(id);
      
      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }
      
      // Check if user has access
      const user = await User.findById(req.user._id);
      const hasAccess = user.facebookAccounts.some(
        acc => acc.pageId === message.pageId
      );
      
      if (!hasAccess) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      
      // Add tags (avoid duplicates)
      message.tags = [...new Set([...message.tags, ...tags])];
      await message.save();
      
      res.json({
        message: 'Tags added successfully',
        message
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/messages/conversations/{senderId}:
   *   get:
   *     summary: Get conversation with a sender
   *     tags: [Messages]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: senderId
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: pageId
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: limit
   *         schema:
   *           type: number
   *           default: 20
   *     responses:
   *       200:
   *         description: Conversation messages
   */
  async getConversation(req, res) {
    try {
      const { senderId } = req.params;
      const { pageId, limit = 20 } = req.query;
      
      // Check if user has access to this page
      const user = await User.findById(req.user._id);
      const hasAccess = user.facebookAccounts.some(acc => acc.pageId === pageId);
      
      if (!hasAccess) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      
      const messages = await Message.find({
        senderId,
        pageId
      }).sort({ createdAt: 1 }).limit(parseInt(limit));
      
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/messages/search:
   *   get:
   *     summary: Search messages
   *     tags: [Messages]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: q
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: pageId
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Search results
   */
  async searchMessages(req, res) {
    try {
      const { q, pageId } = req.query;
      
      const user = await User.findById(req.user._id);
      const userPageIds = user.facebookAccounts.map(acc => acc.pageId);
      
      const query = {
        pageId: pageId ? pageId : { $in: userPageIds },
        $or: [
          { content: { $regex: q, $options: 'i' } },
          { senderName: { $regex: q, $options: 'i' } },
          { tags: { $in: [new RegExp(q, 'i')] } }
        ]
      };
      
      const messages = await Message.find(query)
        .sort({ createdAt: -1 })
        .limit(20);
      
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/messages/export:
   *   get:
   *     summary: Export messages as CSV
   *     tags: [Messages]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: pageId
   *         schema:
   *           type: string
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *     responses:
   *       200:
   *         description: CSV file
   */
  async exportMessages(req, res) {
    try {
      const { pageId, startDate, endDate } = req.query;
      
      const user = await User.findById(req.user._id);
      const userPageIds = user.facebookAccounts.map(acc => acc.pageId);
      
      const query = {
        pageId: pageId ? pageId : { $in: userPageIds }
      };
      
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }
      
      const messages = await Message.find(query).sort({ createdAt: -1 });
      
      // Generate CSV
      const csv = this.generateCSV(messages);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=messages.csv');
      res.send(csv);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  generateCSV(messages) {
    const headers = ['ID', 'Sender ID', 'Sender Name', 'Content', 'Page ID', 'Status', 'Is Read', 'Is Replied', 'Created At'];
    
    const rows = messages.map(message => [
      message._id,
      message.senderId,
      `"${message.senderName || ''}"`,
      `"${message.content.replace(/"/g, '""')}"`,
      message.pageId,
      message.status,
      message.isRead,
      message.isReplied,
      message.createdAt
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}

module.exports = new MessageController();
