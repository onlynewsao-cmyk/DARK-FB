const Analytics = require('../models/Analytics');
const Post = require('../models/Post');
const Message = require('../models/Message');
const FacebookService = require('../services/facebookService');

class AnalyticsController {
  constructor() {
    this.facebookService = new FacebookService(process.env.FACEBOOK_ACCESS_TOKEN);
  }

  /**
   * @swagger
   * /api/analytics/overview:
   *   get:
   *     summary: Get analytics overview
   *     tags: [Analytics]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: pageId
   *         schema:
   *           type: string
   *       - in: query
   *         name: days
   *         schema:
   *           type: number
   *           default: 7
   *     responses:
   *       200:
   *         description: Analytics overview
   */
  async getOverview(req, res) {
    try {
      const { pageId, days = 7 } = req.query;
      
      const user = await User.findById(req.user._id);
      const userPageIds = user.facebookAccounts.map(acc => acc.pageId);
      
      const targetPageId = pageId || userPageIds[0];
      
      if (!targetPageId) {
        return res.status(400).json({ error: 'No Facebook page connected' });
      }
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));
      
      // Get analytics from database
      const dbAnalytics = await Analytics.getAnalyticsByDateRange(targetPageId, startDate, new Date());
      
      // Get posts count
      const postsCount = await Post.countDocuments({
        'user.id': req.user._id,
        'target.id': targetPageId,
        createdAt: { $gte: startDate }
      });
      
      // Get messages count
      const messagesCount = await Message.countDocuments({
        pageId: targetPageId,
        createdAt: { $gte: startDate }
      });
      
      // Get unread messages count
      const unreadCount = await Message.countDocuments({
        pageId: targetPageId,
        isRead: false
      });
      
      // Get Facebook insights
      let fbInsights = null;
      try {
        const facebookAccount = user.facebookAccounts.find(acc => acc.pageId === targetPageId);
        if (facebookAccount) {
          const service = new FacebookService(facebookAccount.pageAccessToken || facebookAccount.accessToken);
          fbInsights = await service.getPageInsights(targetPageId);
        }
      } catch (error) {
        console.error('Error getting Facebook insights:', error);
      }
      
      // Aggregate data
      const overview = {
        pageId: targetPageId,
        days: parseInt(days),
        metrics: {
          totalPosts: postsCount,
          totalMessages: messagesCount,
          unreadMessages: unreadCount,
          ...this.aggregateMetrics(dbAnalytics)
        },
        daily: this.formatDailyAnalytics(dbAnalytics),
        facebookInsights: fbInsights,
        topPosts: await this.getTopPosts(req.user._id, targetPageId, parseInt(days))
      };
      
      res.json(overview);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  aggregateMetrics(analytics) {
    const result = {
      totalFollowers: 0,
      totalEngagement: 0,
      totalReach: 0,
      totalImpressions: 0,
      totalMessagesReceived: 0,
      totalMessagesReplied: 0
    };
    
    analytics.forEach(day => {
      result.totalFollowers += day.metrics.followers || 0;
      result.totalEngagement += day.metrics.engagement || 0;
      result.totalReach += day.metrics.reach || 0;
      result.totalImpressions += day.metrics.impressions || 0;
      result.totalMessagesReceived += day.metrics.messagesReceived || 0;
      result.totalMessagesReplied += day.metrics.messagesReplied || 0;
    });
    
    return result;
  }

  formatDailyAnalytics(analytics) {
    return analytics.map(day => ({
      date: day.date,
      followers: day.metrics.followers || 0,
      engagement: day.metrics.engagement || 0,
      reach: day.metrics.reach || 0,
      impressions: day.metrics.impressions || 0,
      posts: day.metrics.postsPublished || 0,
      messagesReceived: day.metrics.messagesReceived || 0,
      messagesReplied: day.metrics.messagesReplied || 0
    }));
  }

  async getTopPosts(userId, pageId, days) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return Post.find({
      'user.id': userId,
      'target.id': pageId,
      createdAt: { $gte: startDate }
    }).sort({ 'stats.engagement': -1 }).limit(5);
  }

  /**
   * @swagger
   * /api/analytics/posts:
   *   get:
   *     summary: Get post analytics
   *     tags: [Analytics]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: pageId
   *         schema:
   *           type: string
   *       - in: query
   *         name: days
   *         schema:
   *           type: number
   *           default: 7
   *     responses:
   *       200:
   *         description: Post analytics
   */
  async getPostAnalytics(req, res) {
    try {
      const { pageId, days = 7 } = req.query;
      
      const user = await User.findById(req.user._id);
      const userPageIds = user.facebookAccounts.map(acc => acc.pageId);
      
      const targetPageId = pageId || userPageIds[0];
      
      if (!targetPageId) {
        return res.status(400).json({ error: 'No Facebook page connected' });
      }
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));
      
      const posts = await Post.find({
        'user.id': req.user._id,
        'target.id': targetPageId,
        createdAt: { $gte: startDate }
      }).sort({ createdAt: -1 });
      
      const analytics = posts.map(post => ({
        id: post._id,
        content: post.content.substring(0, 50) + (post.content.length > 50 ? '...' : ''),
        createdAt: post.createdAt,
        status: post.status,
        stats: post.stats,
        engagementRate: this.calculateEngagementRate(post)
      }));
      
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  calculateEngagementRate(post) {
    const total = post.stats.likes + post.stats.comments + post.stats.shares;
    const reach = post.stats.reach || 1;
    return ((total / reach) * 100).toFixed(2) + '%';
  }

  /**
   * @swagger
   * /api/analytics/messages:
   *   get:
   *     summary: Get message analytics
   *     tags: [Analytics]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: pageId
   *         schema:
   *           type: string
   *       - in: query
   *         name: days
   *         schema:
   *           type: number
   *           default: 7
   *     responses:
   *       200:
   *         description: Message analytics
   */
  async getMessageAnalytics(req, res) {
    try {
      const { pageId, days = 7 } = req.query;
      
      const user = await User.findById(req.user._id);
      const userPageIds = user.facebookAccounts.map(acc => acc.pageId);
      
      const targetPageId = pageId || userPageIds[0];
      
      if (!targetPageId) {
        return res.status(400).json({ error: 'No Facebook page connected' });
      }
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));
      
      // Get message stats by day
      const messages = await Message.aggregate([
        {
          $match: {
            pageId: targetPageId,
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: { 
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            total: { $sum: 1 },
            read: { 
              $sum: { $cond: ['$isRead', 1, 0] }
            },
            replied: { 
              $sum: { $cond: ['$isReplied', 1, 0] }
            }
          }
        },
        { $sort: { _id: 1 } }
      ]);
      
      // Get top senders
      const topSenders = await Message.aggregate([
        {
          $match: {
            pageId: targetPageId,
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$senderId',
            senderName: { $first: '$senderName' },
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]);
      
      res.json({
        daily: messages,
        topSenders,
        summary: {
          totalMessages: messages.reduce((sum, day) => sum + day.total, 0),
          totalRead: messages.reduce((sum, day) => sum + day.read, 0),
          totalReplied: messages.reduce((sum, day) => sum + day.replied, 0),
          readRate: messages.length > 0 ? 
            ((messages.reduce((sum, day) => sum + day.read, 0) / 
              messages.reduce((sum, day) => sum + day.total, 0)) * 100).toFixed(2) + '%' : '0%'
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/analytics/engagement:
   *   get:
   *     summary: Get engagement analytics
   *     tags: [Analytics]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: pageId
   *         schema:
   *           type: string
   *       - in: query
   *         name: days
   *         schema:
   *           type: number
   *           default: 30
   *     responses:
   *       200:
   *         description: Engagement analytics
   */
  async getEngagementAnalytics(req, res) {
    try {
      const { pageId, days = 30 } = req.query;
      
      const user = await User.findById(req.user._id);
      const userPageIds = user.facebookAccounts.map(acc => acc.pageId);
      
      const targetPageId = pageId || userPageIds[0];
      
      if (!targetPageId) {
        return res.status(400).json({ error: 'No Facebook page connected' });
      }
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));
      
      const posts = await Post.find({
        'user.id': req.user._id,
        'target.id': targetPageId,
        createdAt: { $gte: startDate }
      });
      
      // Calculate engagement metrics
      const totalLikes = posts.reduce((sum, post) => sum + (post.stats.likes || 0), 0);
      const totalComments = posts.reduce((sum, post) => sum + (post.stats.comments || 0), 0);
      const totalShares = posts.reduce((sum, post) => sum + (post.stats.shares || 0), 0);
      const totalReach = posts.reduce((sum, post) => sum + (post.stats.reach || 0), 0);
      const totalImpressions = posts.reduce((sum, post) => sum + (post.stats.impressions || 0), 0);
      
      // Calculate average engagement per post
      const avgLikes = posts.length > 0 ? (totalLikes / posts.length).toFixed(2) : 0;
      const avgComments = posts.length > 0 ? (totalComments / posts.length).toFixed(2) : 0;
      const avgShares = posts.length > 0 ? (totalShares / posts.length).toFixed(2) : 0;
      
      // Calculate engagement rate
      const engagementRate = totalReach > 0 ? 
        ((totalLikes + totalComments + totalShares) / totalReach * 100).toFixed(2) + '%' : '0%';
      
      // Get engagement by day
      const dailyEngagement = await Post.aggregate([
        {
          $match: {
            'user.id': req.user._id,
            'target.id': targetPageId,
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: { 
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            posts: { $sum: 1 },
            likes: { $sum: '$stats.likes' },
            comments: { $sum: '$stats.comments' },
            shares: { $sum: '$stats.shares' },
            reach: { $sum: '$stats.reach' }
          }
        },
        { $sort: { _id: 1 } }
      ]);
      
      res.json({
        summary: {
          totalPosts: posts.length,
          totalLikes,
          totalComments,
          totalShares,
          totalReach,
          totalImpressions,
          avgLikes,
          avgComments,
          avgShares,
          engagementRate
        },
        daily: dailyEngagement
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/analytics/export:
   *   get:
   *     summary: Export analytics as CSV
   *     tags: [Analytics]
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
  async exportAnalytics(req, res) {
    try {
      const { pageId, startDate, endDate } = req.query;
      
      const user = await User.findById(req.user._id);
      const userPageIds = user.facebookAccounts.map(acc => acc.pageId);
      
      const targetPageId = pageId || userPageIds[0];
      
      if (!targetPageId) {
        return res.status(400).json({ error: 'No Facebook page connected' });
      }
      
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();
      
      const analytics = await Analytics.getAnalyticsByDateRange(targetPageId, start, end);
      
      // Generate CSV
      const csv = this.generateCSV(analytics);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=analytics.csv');
      res.send(csv);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  generateCSV(analytics) {
    const headers = ['Date', 'Followers', 'Engagement', 'Reach', 'Impressions', 'Posts', 'Messages Received', 'Messages Replied'];
    
    const rows = analytics.map(day => [
      day.date,
      day.metrics.followers || 0,
      day.metrics.engagement || 0,
      day.metrics.reach || 0,
      day.metrics.impressions || 0,
      day.metrics.postsPublished || 0,
      day.metrics.messagesReceived || 0,
      day.metrics.messagesReplied || 0
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}

module.exports = new AnalyticsController();
