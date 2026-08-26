const FacebookService = require('../services/facebookService');
const User = require('../models/User');
const Post = require('../models/Post');
const Message = require('../models/Message');
const Analytics = require('../models/Analytics');
const ScheduledPost = require('../models/ScheduledPost');
const { getRandomUserAgent, getNextProxy } = require('../config/rateLimiter');

class FacebookController {
  constructor() {
    this.service = new FacebookService(process.env.FACEBOOK_ACCESS_TOKEN);
  }

  // Get random user agent for anti-ban
  getRandomUserAgent() {
    return getRandomUserAgent();
  }

  // Get next proxy for anti-ban
  getNextProxy() {
    return getNextProxy();
  }

  /**
   * @swagger
   * /api/facebook/pages:
   *   get:
   *     summary: Get all Facebook pages the user manages
   *     tags: [Facebook]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of Facebook pages
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   id:
   *                     type: string
   *                   name:
   *                     type: string
   *                   access_token:
   *                     type: string
   */
  async getUserPages(req, res) {
    try {
      // Get user's Facebook accounts
      const user = await User.findById(req.user._id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Get all pages from all connected Facebook accounts
      const allPages = user.getAllPages();
      
      if (allPages.length > 0) {
        // Return all pages from all accounts
        return res.json({ data: allPages });
      }
      
      // If no accounts connected, use default token
      const pages = await this.service.getUserPages();
      res.json(pages);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/facebook/groups:
   *   get:
   *     summary: Get all Facebook groups the user manages
   *     tags: [Facebook]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of Facebook groups
   */
  async getUserGroups(req, res) {
    try {
      const user = await User.findById(req.user._id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Get all groups from all connected Facebook accounts
      const allGroups = user.getAllGroups();
      
      if (allGroups.length > 0) {
        // Return all groups from all accounts
        return res.json({ data: allGroups });
      }
      
      // If no accounts connected, use default token
      const groups = await this.service.getUserGroups();
      res.json(groups);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/facebook/post:
   *   post:
   *     summary: Create a post on Facebook page or group with anti-ban protection
   *     tags: [Facebook]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - targetId
   *               - targetType
   *               - content
   *             properties:
   *               targetId:
   *                 type: string
   *               targetType:
   *                 type: string
   *                 enum: [page, group]
   *               content:
   *                 type: string
   *               mediaUrls:
   *                 type: array
   *                 items:
   *                   type: string
   *               link:
   *                 type: string
   *               scheduledAt:
   *                 type: string
   *                 format: date-time
   *               useProxy:
   *                 type: boolean
   *                 default: false
   *               useRandomDelay:
   *                 type: boolean
   *                 default: true
   *     responses:
   *       201:
   *         description: Post created successfully
   */
  async createPost(req, res) {
    try {
      const { targetId, targetType, content, mediaUrls = [], link, scheduledAt, 
              useProxy = false, useRandomDelay = true } = req.body;
      const userId = req.user._id;

      // Get user's Facebook account for this target
      const user = await User.findById(userId);
      
      // Find the page or group across all accounts
      let targetAccount = null;
      let targetPage = null;
      let targetGroup = null;
      
      if (targetType === 'page') {
        targetPage = user.getPageById(targetId);
        if (targetPage) {
          targetAccount = user.getAccountByPageId(targetId);
        }
      } else if (targetType === 'group') {
        targetGroup = user.getGroupById(targetId);
        if (targetGroup) {
          targetAccount = user.getAccountByGroupId(targetId);
        }
      }
      
      // Fallback to old facebook field for backward compatibility
      if (!targetAccount && user.facebook?.accessToken) {
        targetAccount = { accessToken: user.facebook.accessToken };
      }
      
      if (!targetAccount) {
        return res.status(400).json({
          error: 'No Facebook account connected for this target'
        });
      }
      
      const accessToken = targetPage?.pageAccessToken || 
                         targetGroup?.groupAccessToken || 
                         targetAccount?.accessToken || 
                         process.env.FACEBOOK_ACCESS_TOKEN;
      
      // Create post in database
      const post = new Post({
        content,
        user: {
          id: userId,
          name: req.user.name
        },
        target: {
          type: targetType,
          id: targetId
        },
        media: mediaUrls.map(url => ({
          url,
          type: this.getMediaType(url)
        })),
        status: scheduledAt ? 'scheduled' : 'draft',
        antiBan: {
          useProxy,
          useRandomDelay,
          userAgent: useRandomDelay ? this.getRandomUserAgent() : undefined
        }
      });

      await post.save();

      // If scheduled, create scheduled post
      if (scheduledAt) {
        await ScheduledPost.create({
          postId: post._id,
          userId,
          scheduleTime: new Date(scheduledAt),
          target: {
            type: targetType,
            id: targetId
          },
          timezone: user.settings?.timezone || 'Africa/Luanda',
          antiBan: post.antiBan
        });

        return res.status(201).json({
          message: 'Post scheduled successfully',
          post,
          scheduled: true
        });
      }

      // Post immediately with anti-ban protection
      const service = new FacebookService(accessToken);
      
      // Apply random delay if enabled
      if (useRandomDelay) {
        const delay = Math.random() * 5000; // 0-5 seconds
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      let facebookResponse;
      if (targetType === 'page') {
        if (mediaUrls.length > 0) {
          // Post with media
          if (mediaUrls.length === 1) {
            facebookResponse = await service.uploadPhotoFromUrl(targetId, mediaUrls[0], content);
          } else {
            facebookResponse = await service.postAlbum(targetId, content, mediaUrls);
          }
        } else {
          facebookResponse = await service.postToPage(targetId, content, link);
        }
      } else if (targetType === 'group') {
        facebookResponse = await service.postToGroup(targetId, content, link);
      }

      // Update post with Facebook ID
      post.facebookPostId = facebookResponse?.id;
      post.status = 'posted';
      post.postedAt = new Date();
      await post.save();

      // Update analytics
      await Analytics.updateAnalytics(post.target.id, post.target.name || 'Unknown', {
        metrics: { postsPublished: 1 }
      });

      res.status(201).json({
        message: 'Post created successfully',
        post,
        facebookResponse
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  getMediaType(url) {
    if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return 'image';
    if (url.match(/\.(mp4|mov|avi|wmv|flv)$/i)) return 'video';
    if (url.match(/\.(mp3|wav|ogg|aac)$/i)) return 'audio';
    return 'image';
  }

  /**
   * @swagger
   * /api/facebook/posts:
   *   get:
   *     summary: Get all posts from a page
   *     tags: [Facebook]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: pageId
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: limit
   *         schema:
   *           type: number
   *           default: 10
   *     responses:
   *       200:
   *         description: List of posts
   */
  async getPagePosts(req, res) {
    try {
      const { pageId, limit = 10 } = req.query;
      const user = await User.findById(req.user._id);
      const page = user.getPageById(pageId);
      const account = user.getAccountByPageId(pageId);
      
      const accessToken = page?.pageAccessToken || 
                         account?.accessToken || 
                         user.facebook?.accessToken || 
                         process.env.FACEBOOK_ACCESS_TOKEN;
      
      const service = new FacebookService(accessToken);
      const posts = await service.getPagePosts(pageId, limit);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/facebook/messages:
   *   get:
   *     summary: Get messages from a page
   *     tags: [Facebook]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: pageId
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: limit
   *         schema:
   *           type: number
   *           default: 10
   *     responses:
   *       200:
   *         description: List of conversations
   */
  async getPageMessages(req, res) {
    try {
      const { pageId, limit = 10 } = req.query;
      const user = await User.findById(req.user._id);
      const page = user.getPageById(pageId);
      const account = user.getAccountByPageId(pageId);
      
      const accessToken = page?.pageAccessToken || 
                         account?.accessToken || 
                         user.facebook?.accessToken || 
                         process.env.FACEBOOK_ACCESS_TOKEN;
      
      const service = new FacebookService(accessToken);
      const conversations = await service.getPageMessages(pageId, limit);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/facebook/messages/{conversationId}:
   *   get:
   *     summary: Get messages from a conversation
   *     tags: [Facebook]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: conversationId
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: limit
   *         schema:
   *           type: number
   *           default: 10
   *     responses:
   *       200:
   *         description: List of messages
   */
  async getConversationMessages(req, res) {
    try {
      const { conversationId } = req.params;
      const { limit = 10, pageId } = req.query;
      const user = await User.findById(req.user._id);
      
      // If pageId is provided, use it to get the correct account
      let page = null;
      let account = null;
      
      if (pageId) {
        page = user.getPageById(pageId);
        account = user.getAccountByPageId(pageId);
      } else {
        // Use first available page
        const allPages = user.getAllPages();
        if (allPages.length > 0) {
          page = allPages[0];
          account = user.getAccountByPageId(page.pageId);
        }
      }
      
      const accessToken = page?.pageAccessToken || 
                         account?.accessToken || 
                         user.facebook?.accessToken || 
                         process.env.FACEBOOK_ACCESS_TOKEN;
      
      const service = new FacebookService(accessToken);
      const messages = await service.getConversationMessages(conversationId, limit);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/facebook/send-message:
   *   post:
   *     summary: Send a message via Messenger with anti-ban
   *     tags: [Facebook]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - pageId
   *               - recipientId
   *               - message
   *             properties:
   *               pageId:
   *                 type: string
   *               recipientId:
   *                 type: string
   *               message:
   *                 type: string
   *               imageUrl:
   *                 type: string
   *               useProxy:
   *                 type: boolean
   *                 default: false
   *               useRandomDelay:
   *                 type: boolean
   *                 default: true
   *     responses:
   *       201:
   *         description: Message sent successfully
   */
  async sendMessage(req, res) {
    try {
      const { pageId, recipientId, message, imageUrl, useProxy = false, useRandomDelay = true } = req.body;
      
      const user = await User.findById(req.user._id);
      const page = user.getPageById(pageId);
      const account = user.getAccountByPageId(pageId);
      
      if (!page && !account) {
        return res.status(400).json({
          error: 'Facebook account not connected for this page'
        });
      }
      
      const accessToken = page?.pageAccessToken || account?.accessToken || user.facebook?.accessToken;
      
      const service = new FacebookService(accessToken);
      
      // Apply random delay if enabled
      if (useRandomDelay) {
        const delay = Math.random() * 3000; // 0-3 seconds
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      let response;
      if (imageUrl) {
        response = await service.sendMessageWithImage(pageId, recipientId, message, imageUrl);
      } else {
        response = await service.sendMessage(pageId, recipientId, message);
      }

      // Save message to database
      await Message.create({
        senderId: req.user._id.toString(),
        senderName: req.user.name,
        content: message,
        pageId,
        pageName: page?.pageName || account?.accountName || pageId,
        metadata: {
          messageId: response?.message_id,
          threadId: response?.recipient_id
        },
        isRead: true,
        isReplied: false,
        antiBan: {
          useProxy,
          useRandomDelay,
          userAgent: useRandomDelay ? this.getRandomUserAgent() : undefined
        }
      });

      // Update analytics
      await Analytics.updateAnalytics(pageId, page?.pageName || account?.accountName || 'Unknown', {
        metrics: { messagesReplied: 1 }
      });

      res.status(201).json({
        message: 'Message sent successfully',
        response
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/facebook/insights:
   *   get:
   *     summary: Get page insights
   *     tags: [Facebook]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: pageId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Page insights
   */
  async getPageInsights(req, res) {
    try {
      const { pageId } = req.query;
      const user = await User.findById(req.user._id);
      const page = user.getPageById(pageId);
      const account = user.getAccountByPageId(pageId);
      
      const accessToken = page?.pageAccessToken || 
                         account?.accessToken || 
                         user.facebook?.accessToken || 
                         process.env.FACEBOOK_ACCESS_TOKEN;
      
      const service = new FacebookService(accessToken);
      const insights = await service.getPageInsights(pageId);
      res.json(insights);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/facebook/webhook:
   *   get:
   *     summary: Verify webhook
   *     tags: [Facebook]
   *     parameters:
   *       - in: query
   *         name: hub.mode
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: hub.challenge
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: hub.verify_token
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Webhook verified
   */
  async verifyWebhook(req, res) {
    try {
      const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': token } = req.query;
      
      if (mode === 'subscribe' && token === process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN) {
        res.status(200).send(challenge);
      } else {
        res.status(403).send('Verification failed');
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/facebook/webhook:
   *   post:
   *     summary: Handle webhook events
   *     tags: [Facebook]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       200:
   *         description: Event processed
   */
  async handleWebhook(req, res) {
    try {
      const { object, entry } = req.body;
      
      if (object === 'page') {
        for (const pageEntry of entry) {
          const { id: pageId, time, messaging, changes } = pageEntry;
          
          // Handle messaging events
          if (messaging) {
            for (const event of messaging) {
              await this.handleMessagingEvent(pageId, event);
            }
          }
          
          // Handle changes (feed, etc.)
          if (changes) {
            for (const change of changes) {
              await this.handleChangeEvent(pageId, change);
            }
          }
        }
      }
      
      res.status(200).send('EVENT_RECEIVED');
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async handleMessagingEvent(pageId, event) {
    const { message, sender, recipient, timestamp } = event;
    
    // Handle message
    if (message) {
      const { mid, text, attachments, quick_reply } = message;
      
      // Find users with this page (using new model structure)
      const users = await User.find({ 'facebookAccounts.pages.pageId': pageId });
      
      for (const user of users) {
        // Get the page name from the account
        const page = user.getPageById(pageId);
        const pageName = page?.pageName || recipient.id;
        
        // Save message to database
        await Message.create({
          senderId: sender.id,
          senderName: sender.id, // Will be updated later
          content: text || '[Attachment]',
          pageId,
          pageName,
          metadata: {
            messageId: mid,
            threadId: recipient.id,
            timestamp
          },
          attachments: attachments ? attachments.map(a => ({
            url: a.payload?.url,
            type: a.type,
            name: a.title || a.url?.split('/').pop()
          })) : [],
          tags: quick_reply ? [quick_reply.payload] : []
        });
      }
      
      // Emit socket event for real-time updates
      if (this.io) {
        this.io.emit('new-message', {
          pageId,
          senderId: sender.id,
          message: text || '[Attachment]',
          timestamp
        });
      }
    }
    
    // Handle postback (button clicks)
    if (event.postback) {
      const { payload, title } = event.postback;
      
      await Message.create({
        senderId: sender.id,
        senderName: sender.id,
        content: `[Postback: ${title || payload}]`,
        pageId,
        pageName: recipient.id,
        metadata: {
          messageId: event.postback.mid,
          threadId: recipient.id,
          timestamp
        },
        tags: ['postback', payload]
      });
    }
    
    // Handle read receipts
    if (event.read) {
      await Message.updateMany(
        { 
          pageId, 
          'metadata.threadId': recipient.id,
          isRead: false 
        },
        { isRead: true, status: 'read' }
      );
    }
  }

  async handleChangeEvent(pageId, change) {
    const { field, value } = change;
    
    switch (field) {
      case 'feed':
        // New post, edit, or delete
        const { post_id, verb } = value;
        
        if (verb === 'add') {
          // New post
          const postData = await this.service.getPagePosts(pageId, 1, ['id', 'message', 'created_time']);
          if (postData.data && postData.data.length > 0) {
            const post = postData.data[0];
            
            // Save to database
            await Post.create({
              content: post.message || '',
              user: { id: 'system', name: 'Facebook' },
              target: { type: 'page', id: pageId },
              facebookPostId: post.id,
              status: 'posted',
              postedAt: new Date(post.created_time)
            });
          }
        }
        break;
    }
  }

  /**
   * @swagger
   * /api/facebook/connect:
   *   post:
   *     summary: Connect Facebook account
   *     tags: [Facebook]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - accessToken
   *             properties:
   *               accessToken:
   *                 type: string
   *               pageId:
   *                 type: string
   *               pageName:
   *                 type: string
   *     responses:
   *       200:
   *         description: Facebook account connected
   */
  async connectFacebookAccount(req, res) {
    try {
      const { accessToken, pageId, pageName, accountId } = req.body;
      
      // Verify token
      const debugInfo = await this.service.debugToken(accessToken);
      
      if (!debugInfo.data || !debugInfo.data.is_valid) {
        return res.status(400).json({ error: 'Invalid access token' });
      }
      
      // Get user info and pages
      const tempService = new FacebookService(accessToken);
      const userInfo = await tempService.getUserProfile('me', ['id', 'name', 'email']);
      const pages = await tempService.getUserPages();
      
      // Find the selected page
      const selectedPage = pages.data.find(p => p.id === pageId);
      
      if (!selectedPage) {
        return res.status(400).json({ error: 'Page not found' });
      }
      
      // Add to user's Facebook accounts using the new model
      const user = await User.findById(req.user._id);
      
      // Prepare account data
      const accountData = {
        accountId: accountId || userInfo.id,
        accountName: userInfo.name,
        accountType: 'personal',
        accessToken,
        tokenExpires: new Date(Date.now() + (debugInfo.data.expires_in || 3600) * 1000),
        tokenType: debugInfo.data.expires_in ? 'short_lived' : 'never_expiring',
        pages: [{
          pageId: selectedPage.id,
          pageName: selectedPage.name || pageName,
          pageAccessToken: selectedPage.access_token,
          permissions: debugInfo.data.scopes || [],
          isConnected: true,
          connectedAt: new Date()
        }],
        groups: [],
        isConnected: true,
        connectedAt: new Date()
      };
      
      // Add or update account
      await user.addFacebookAccount(accountData);
      
      res.json({
        message: 'Facebook account connected successfully',
        page: {
          id: selectedPage.id,
          name: selectedPage.name,
          accessToken: selectedPage.access_token
        },
        accountId: accountData.accountId
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/facebook/disconnect/{pageId}:
   *   delete:
   *     summary: Disconnect Facebook page
   *     tags: [Facebook]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: pageId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Facebook page disconnected
   */
  async disconnectFacebookPage(req, res) {
    try {
      const { pageId } = req.params;
      
      const user = await User.findById(req.user._id);
      
      // Find which account has this page
      const account = user.getAccountByPageId(pageId);
      
      if (account) {
        // Remove page from account
        await user.removePageFromAccount(account.accountId, pageId);
      } else {
        // Fallback: try to remove from facebookAccounts array (old structure)
        user.facebookAccounts = user.facebookAccounts.filter(
          acc => acc.pageId !== pageId
        );
        await user.save();
      }
      
      res.json({ message: 'Facebook page disconnected successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/facebook/search:
   *   get:
   *     summary: Search for pages or groups
   *     tags: [Facebook]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: q
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: type
   *         schema:
   *           type: string
   *           enum: [page, group]
   *           default: page
   *       - in: query
   *         name: limit
   *         schema:
   *           type: number
   *           default: 5
   *     responses:
   *       200:
   *         description: Search results
   */
  async search(req, res) {
    try {
      const { q, type = 'page', limit = 5 } = req.query;
      
      let results;
      if (type === 'page') {
        results = await this.service.searchPages(q, limit);
      } else {
        results = await this.service.searchGroups(q, limit);
      }
      
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new FacebookController();
