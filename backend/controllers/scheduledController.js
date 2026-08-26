const ScheduledPost = require('../models/ScheduledPost');
const Post = require('../models/Post');
const FacebookService = require('../services/facebookService');
const cron = require('node-cron');

class ScheduledController {
  constructor() {
    this.facebookService = new FacebookService(process.env.FACEBOOK_ACCESS_TOKEN);
    this.scheduler = null;
    this.initializeScheduler();
  }

  initializeScheduler() {
    // Run every minute to check for posts to publish
    this.scheduler = cron.schedule('* * * * *', async () => {
      try {
        console.log('Checking for scheduled posts to publish...');
        await this.publishScheduledPosts();
      } catch (error) {
        console.error('Error in scheduled post publisher:', error);
      }
    });
  }

  async publishScheduledPosts() {
    const scheduledPosts = await ScheduledPost.getPostsToPublish();
    
    for (const scheduled of scheduledPosts) {
      try {
        // Check if already processed
        if (scheduled.status !== 'pending') continue;
        
        // Get the post
        const post = await Post.findById(scheduled.postId);
        if (!post) continue;
        
        // Get user and Facebook account
        const user = await User.findById(scheduled.userId);
        if (!user) continue;
        
        const facebookAccount = user.facebookAccounts.find(
          acc => acc.pageId === scheduled.target.id
        );
        
        if (!facebookAccount) continue;
        
        // Publish the post
        const service = new FacebookService(facebookAccount.pageAccessToken || facebookAccount.accessToken);
        
        let facebookResponse;
        if (scheduled.target.type === 'page') {
          if (post.media.length > 0) {
            if (post.media.length === 1) {
              facebookResponse = await service.uploadPhotoFromUrl(
                scheduled.target.id,
                post.media[0].url,
                post.content
              );
            } else {
              facebookResponse = await service.postAlbum(
                scheduled.target.id,
                post.content,
                post.media.map(m => m.url)
              );
            }
          } else {
            facebookResponse = await service.postToPage(scheduled.target.id, post.content);
          }
        } else if (scheduled.target.type === 'group') {
          facebookResponse = await service.postToGroup(scheduled.target.id, post.content);
        }
        
        // Update post
        post.facebookPostId = facebookResponse?.id;
        post.status = 'posted';
        post.postedAt = new Date();
        await post.save();
        
        // Update scheduled post
        await scheduled.markAsPublished(facebookResponse?.id);
        
        console.log(`Published scheduled post ${post._id}`);
        
        // Handle recurrence
        if (scheduled.recurrence.type !== 'once') {
          await this.handleRecurrence(scheduled);
        }
      } catch (error) {
        console.error(`Error publishing scheduled post ${scheduled._id}:`, error);
        await scheduled.markAsFailed(error.message);
      }
    }
  }

  async handleRecurrence(scheduled) {
    const now = new Date();
    const { type, interval, endDate, daysOfWeek, dayOfMonth } = scheduled.recurrence;
    
    // Check if we should continue
    if (endDate && new Date(endDate) <= now) {
      return; // Recurrence ended
    }
    
    let nextDate;
    
    switch (type) {
      case 'daily':
        nextDate = new Date(now);
        nextDate.setDate(nextDate.getDate() + interval);
        break;
        
      case 'weekly':
        nextDate = new Date(now);
        nextDate.setDate(nextDate.getDate() + (7 * interval));
        break;
        
      case 'monthly':
        nextDate = new Date(now);
        nextDate.setMonth(nextDate.getMonth() + interval);
        if (dayOfMonth) {
          nextDate.setDate(dayOfMonth);
        }
        break;
    }
    
    if (nextDate > now) {
      // Create new scheduled post
      const newScheduled = new ScheduledPost({
        postId: scheduled.postId,
        userId: scheduled.userId,
        scheduleTime: nextDate,
        target: scheduled.target,
        recurrence: scheduled.recurrence,
        timezone: scheduled.timezone
      });
      
      await newScheduled.save();
      
      // Update post status back to scheduled
      const post = await Post.findById(scheduled.postId);
      if (post) {
        post.status = 'scheduled';
        await post.save();
      }
    }
  }

  /**
   * @swagger
   * /api/scheduled:
   *   get:
   *     summary: Get all scheduled posts
   *     tags: [Scheduled]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [pending, published, cancelled, failed]
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
   *         description: List of scheduled posts
   */
  async getAllScheduledPosts(req, res) {
    try {
      const { status, page = 1, limit = 10 } = req.query;
      
      const query = { userId: req.user._id };
      
      if (status) query.status = status;
      
      const scheduledPosts = await ScheduledPost.find(query)
        .populate('postId')
        .sort({ scheduleTime: 1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));
      
      const total = await ScheduledPost.countDocuments(query);
      
      res.json({
        scheduledPosts,
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
   * /api/scheduled/upcoming:
   *   get:
   *     summary: Get upcoming scheduled posts
   *     tags: [Scheduled]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: number
   *           default: 10
   *     responses:
   *       200:
   *         description: Upcoming scheduled posts
   */
  async getUpcomingPosts(req, res) {
    try {
      const { limit = 10 } = req.query;
      
      const upcoming = await ScheduledPost.getUpcomingPosts(req.user._id, parseInt(limit));
      
      res.json(upcoming);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/scheduled/{id}:
   *   get:
   *     summary: Get a scheduled post
   *     tags: [Scheduled]
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
   *         description: Scheduled post data
   */
  async getScheduledPost(req, res) {
    try {
      const { id } = req.params;
      
      const scheduledPost = await ScheduledPost.findById(id).populate('postId');
      
      if (!scheduledPost) {
        return res.status(404).json({ error: 'Scheduled post not found' });
      }
      
      if (scheduledPost.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      
      res.json(scheduledPost);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/scheduled/{id}:
   *   put:
   *     summary: Update a scheduled post
   *     tags: [Scheduled]
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
   *               scheduleTime:
   *                 type: string
   *                 format: date-time
   *               recurrence:
   *                 type: object
   *               timezone:
   *                 type: string
   *     responses:
   *       200:
   *         description: Scheduled post updated
   */
  async updateScheduledPost(req, res) {
    try {
      const { id } = req.params;
      const { scheduleTime, recurrence, timezone } = req.body;
      
      const scheduledPost = await ScheduledPost.findById(id);
      
      if (!scheduledPost) {
        return res.status(404).json({ error: 'Scheduled post not found' });
      }
      
      if (scheduledPost.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      
      if (scheduleTime) scheduledPost.scheduleTime = new Date(scheduleTime);
      if (recurrence) scheduledPost.recurrence = recurrence;
      if (timezone) scheduledPost.timezone = timezone;
      
      await scheduledPost.save();
      
      res.json({
        message: 'Scheduled post updated',
        scheduledPost
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/scheduled/{id}/cancel:
   *   post:
   *     summary: Cancel a scheduled post
   *     tags: [Scheduled]
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
   *         description: Scheduled post cancelled
   */
  async cancelScheduledPost(req, res) {
    try {
      const { id } = req.params;
      
      const scheduledPost = await ScheduledPost.findById(id);
      
      if (!scheduledPost) {
        return res.status(404).json({ error: 'Scheduled post not found' });
      }
      
      if (scheduledPost.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      
      await scheduledPost.cancel();
      
      // Update post status
      const post = await Post.findById(scheduledPost.postId);
      if (post) {
        post.status = 'draft';
        await post.save();
      }
      
      res.json({ message: 'Scheduled post cancelled' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/scheduled/{id}/publish-now:
   *   post:
   *     summary: Publish a scheduled post now
   *     tags: [Scheduled]
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
   *         description: Scheduled post published
   */
  async publishNow(req, res) {
    try {
      const { id } = req.params;
      
      const scheduledPost = await ScheduledPost.findById(id).populate('postId');
      
      if (!scheduledPost) {
        return res.status(404).json({ error: 'Scheduled post not found' });
      }
      
      if (scheduledPost.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      
      if (scheduledPost.status !== 'pending') {
        return res.status(400).json({ error: 'Scheduled post is not pending' });
      }
      
      // Get user and Facebook account
      const user = await User.findById(req.user._id);
      const facebookAccount = user.facebookAccounts.find(
        acc => acc.pageId === scheduledPost.target.id
      );
      
      if (!facebookAccount) {
        return res.status(400).json({
          error: 'Facebook account not connected for this target'
        });
      }
      
      // Publish the post
      const service = new FacebookService(facebookAccount.pageAccessToken || facebookAccount.accessToken);
      
      let facebookResponse;
      if (scheduledPost.target.type === 'page') {
        if (scheduledPost.postId.media.length > 0) {
          if (scheduledPost.postId.media.length === 1) {
            facebookResponse = await service.uploadPhotoFromUrl(
              scheduledPost.target.id,
              scheduledPost.postId.media[0].url,
              scheduledPost.postId.content
            );
          } else {
            facebookResponse = await service.postAlbum(
              scheduledPost.target.id,
              scheduledPost.postId.content,
              scheduledPost.postId.media.map(m => m.url)
            );
          }
        } else {
          facebookResponse = await service.postToPage(scheduledPost.target.id, scheduledPost.postId.content);
        }
      } else if (scheduledPost.target.type === 'group') {
        facebookResponse = await service.postToGroup(scheduledPost.target.id, scheduledPost.postId.content);
      }
      
      // Update post
      scheduledPost.postId.facebookPostId = facebookResponse?.id;
      scheduledPost.postId.status = 'posted';
      scheduledPost.postId.postedAt = new Date();
      await scheduledPost.postId.save();
      
      // Update scheduled post
      await scheduledPost.markAsPublished(facebookResponse?.id);
      
      res.json({
        message: 'Post published successfully',
        facebookResponse
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/scheduled/cleanup:
   *   post:
   *     summary: Cleanup old scheduled posts
   *     tags: [Scheduled]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               days:
   *                 type: number
   *                 default: 30
   *     responses:
   *       200:
   *         description: Cleanup completed
   */
  async cleanupOldPosts(req, res) {
    try {
      const { days = 30 } = req.body;
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
      
      // Delete old scheduled posts that are not pending
      const result = await ScheduledPost.deleteMany({
        userId: req.user._id,
        status: { $ne: 'pending' },
        scheduleTime: { $lt: cutoffDate }
      });
      
      res.json({
        message: 'Cleanup completed',
        deletedCount: result.deletedCount
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new ScheduledController();
