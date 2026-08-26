const Post = require('../models/Post');
const ScheduledPost = require('../models/ScheduledPost');
const FacebookService = require('../services/facebookService');
const Analytics = require('../models/Analytics');

class PostController {
  constructor() {
    this.facebookService = new FacebookService(process.env.FACEBOOK_ACCESS_TOKEN);
  }

  /**
   * @swagger
   * /api/posts:
   *   get:
   *     summary: Get all posts
   *     tags: [Posts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [draft, scheduled, posted, failed]
   *       - in: query
   *         name: targetType
   *         schema:
   *           type: string
   *           enum: [page, group, channel]
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
   *         description: List of posts
   */
  async getAllPosts(req, res) {
    try {
      const { status, targetType, page = 1, limit = 10 } = req.query;
      
      const query = { 'user.id': req.user._id };
      
      if (status) query.status = status;
      if (targetType) query['target.type'] = targetType;
      
      const posts = await Post.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));
      
      const total = await Post.countDocuments(query);
      
      res.json({
        posts,
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
   * /api/posts:
   *   post:
   *     summary: Create a new post (draft)
   *     tags: [Posts]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - content
   *               - targetId
   *               - targetType
   *             properties:
   *               content:
   *                 type: string
   *               targetId:
   *                 type: string
   *               targetType:
   *                 type: string
   *                 enum: [page, group, channel]
   *               mediaUrls:
   *                 type: array
   *                 items:
   *                   type: string
   *               settings:
   *                 type: object
   *                 properties:
   *                   autoReply:
   *                     type: boolean
   *                   replyMessage:
   *                     type: string
   *                   tags:
   *                     type: array
   *                     items:
   *                       type: string
   *     responses:
   *       201:
   *         description: Post created
   */
  async createPost(req, res) {
    try {
      const { content, targetId, targetType, mediaUrls = [], settings = {} } = req.body;
      
      const post = new Post({
        content,
        user: {
          id: req.user._id,
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
        settings,
        status: 'draft'
      });
      
      await post.save();
      
      res.status(201).json({
        message: 'Post created as draft',
        post
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
   * /api/posts/{id}:
   *   get:
   *     summary: Get a single post
   *     tags: [Posts]
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
   *         description: Post data
   */
  async getPost(req, res) {
    try {
      const { id } = req.params;
      
      const post = await Post.findById(id);
      
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      
      // Check if user owns the post
      if (post.user.id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      
      res.json(post);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/posts/{id}:
   *   put:
   *     summary: Update a post
   *     tags: [Posts]
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
   *             properties:
   *               content:
   *                 type: string
   *               mediaUrls:
   *                 type: array
   *                 items:
   *                   type: string
   *               settings:
   *                 type: object
   *     responses:
   *       200:
   *         description: Post updated
   */
  async updatePost(req, res) {
    try {
      const { id } = req.params;
      const { content, mediaUrls, settings } = req.body;
      
      const post = await Post.findById(id);
      
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      
      if (post.user.id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      
      if (content) post.content = content;
      if (mediaUrls) {
        post.media = mediaUrls.map(url => ({
          url,
          type: this.getMediaType(url)
        }));
      }
      if (settings) post.settings = settings;
      
      await post.save();
      
      res.json({
        message: 'Post updated successfully',
        post
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/posts/{id}/publish:
   *   post:
   *     summary: Publish a draft post
   *     tags: [Posts]
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
   *         description: Post published
   */
  async publishPost(req, res) {
    try {
      const { id } = req.params;
      
      const post = await Post.findById(id);
      
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      
      if (post.user.id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      
      if (post.status !== 'draft') {
        return res.status(400).json({ error: 'Post is not a draft' });
      }
      
      // Find the user's Facebook account for this target
      const user = await User.findById(req.user._id);
      const facebookAccount = user.facebookAccounts.find(
        acc => acc.pageId === post.target.id
      );
      
      if (!facebookAccount) {
        return res.status(400).json({
          error: 'Facebook account not connected for this target'
        });
      }
      
      // Publish to Facebook
      const service = new FacebookService(facebookAccount.pageAccessToken || facebookAccount.accessToken);
      
      let facebookResponse;
      if (post.target.type === 'page') {
        if (post.media.length > 0) {
          if (post.media.length === 1) {
            facebookResponse = await service.uploadPhotoFromUrl(
              post.target.id, 
              post.media[0].url, 
              post.content
            );
          } else {
            facebookResponse = await service.postAlbum(
              post.target.id,
              post.content,
              post.media.map(m => m.url)
            );
          }
        } else {
          facebookResponse = await service.postToPage(post.target.id, post.content);
        }
      } else if (post.target.type === 'group') {
        facebookResponse = await service.postToGroup(post.target.id, post.content);
      }
      
      // Update post
      post.facebookPostId = facebookResponse?.id;
      post.status = 'posted';
      post.postedAt = new Date();
      await post.save();
      
      // Update analytics
      await Analytics.updateAnalytics(post.target.id, post.target.name || 'Unknown', {
        metrics: { postsPublished: 1 }
      });
      
      res.json({
        message: 'Post published successfully',
        post,
        facebookResponse
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/posts/{id}:
   *   delete:
   *     summary: Delete a post
   *     tags: [Posts]
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
   *         description: Post deleted
   */
  async deletePost(req, res) {
    try {
      const { id } = req.params;
      
      const post = await Post.findById(id);
      
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      
      if (post.user.id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      
      // If posted on Facebook, try to delete it
      if (post.facebookPostId && post.status === 'posted') {
        try {
          const user = await User.findById(req.user._id);
          const facebookAccount = user.facebookAccounts.find(
            acc => acc.pageId === post.target.id
          );
          
          if (facebookAccount) {
            const service = new FacebookService(facebookAccount.pageAccessToken || facebookAccount.accessToken);
            await service.deletePost(post.facebookPostId);
          }
        } catch (fbError) {
          console.error('Error deleting Facebook post:', fbError);
        }
      }
      
      await post.deleteOne();
      
      res.json({ message: 'Post deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/posts/{id}/schedule:
   *   post:
   *     summary: Schedule a post
   *     tags: [Posts]
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
   *               - scheduleTime
   *             properties:
   *               scheduleTime:
   *                 type: string
   *                 format: date-time
   *               recurrence:
   *                 type: object
   *                 properties:
   *                   type:
   *                     type: string
   *                     enum: [once, daily, weekly, monthly]
   *                   interval:
   *                     type: number
   *                   endDate:
   *                     type: string
   *                     format: date-time
   *     responses:
   *       200:
   *         description: Post scheduled
   */
  async schedulePost(req, res) {
    try {
      const { id } = req.params;
      const { scheduleTime, recurrence = { type: 'once' }, timezone = 'UTC' } = req.body;
      
      const post = await Post.findById(id);
      
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      
      if (post.user.id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      
      if (post.status !== 'draft') {
        return res.status(400).json({ error: 'Only draft posts can be scheduled' });
      }
      
      // Create scheduled post
      const scheduledPost = new ScheduledPost({
        postId: post._id,
        userId: req.user._id,
        scheduleTime: new Date(scheduleTime),
        target: post.target,
        recurrence,
        timezone
      });
      
      await scheduledPost.save();
      
      // Update post status
      post.status = 'scheduled';
      await post.save();
      
      res.json({
        message: 'Post scheduled successfully',
        scheduledPost
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/posts/{id}/cancel-schedule:
   *   post:
   *     summary: Cancel scheduled post
   *     tags: [Posts]
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
   *         description: Schedule cancelled
   */
  async cancelSchedule(req, res) {
    try {
      const { id } = req.params;
      
      const scheduledPost = await ScheduledPost.findOne({ postId: id });
      
      if (!scheduledPost) {
        return res.status(404).json({ error: 'Scheduled post not found' });
      }
      
      if (scheduledPost.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      
      await scheduledPost.cancel();
      
      // Update post status
      const post = await Post.findById(id);
      if (post) {
        post.status = 'draft';
        await post.save();
      }
      
      res.json({ message: 'Schedule cancelled successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/posts/stats/{id}:
   *   get:
   *     summary: Get post statistics
   *     tags: [Posts]
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
   *         description: Post statistics
   */
  async getPostStats(req, res) {
    try {
      const { id } = req.params;
      
      const post = await Post.findById(id);
      
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      
      if (post.user.id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      
      // If post has Facebook ID, get insights
      let insights = null;
      if (post.facebookPostId) {
        const user = await User.findById(req.user._id);
        const facebookAccount = user.facebookAccounts.find(
          acc => acc.pageId === post.target.id
        );
        
        if (facebookAccount) {
          const service = new FacebookService(facebookAccount.pageAccessToken || facebookAccount.accessToken);
          insights = await service.getPostInsights(post.facebookPostId);
        }
      }
      
      res.json({
        postStats: post.stats,
        facebookInsights: insights
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/posts/export:
   *   get:
   *     summary: Export posts as CSV
   *     tags: [Posts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: status
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
  async exportPosts(req, res) {
    try {
      const { status, startDate, endDate } = req.query;
      
      const query = { 'user.id': req.user._id };
      
      if (status) query.status = status;
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }
      
      const posts = await Post.find(query).sort({ createdAt: -1 });
      
      // Generate CSV
      const csv = this.generateCSV(posts);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=posts.csv');
      res.send(csv);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  generateCSV(posts) {
    const headers = ['ID', 'Content', 'Target Type', 'Target ID', 'Status', 'Scheduled At', 'Posted At', 'Likes', 'Comments', 'Shares', 'Reach'];
    
    const rows = posts.map(post => [
      post._id,
      `"${post.content.replace(/"/g, '""')}"`,
      post.target.type,
      post.target.id,
      post.status,
      post.scheduledAt || '',
      post.postedAt || '',
      post.stats.likes,
      post.stats.comments,
      post.stats.shares,
      post.stats.reach
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}

module.exports = new PostController();
