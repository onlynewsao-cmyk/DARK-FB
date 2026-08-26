const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Analytics:
 *       type: object
 *       required:
 *         - pageId
 *         - date
 *       properties:
 *         pageId:
 *           type: string
 *         date:
 *           type: string
 *           format: date
 *         metrics:
 *           type: object
 *           properties:
 *             followers:
 *               type: number
 *             engagement:
 *               type: number
 *             reach:
 *               type: number
 *             impressions:
 *               type: number
 *             posts:
 *               type: number
 *             messagesReceived:
 *               type: number
 *             messagesReplied:
 *               type: number
 *         topPosts:
 *           type: array
 *           items:
 *             type: object
 *         createdAt:
 *           type: string
 *           format: date-time
 */

const analyticsSchema = new mongoose.Schema({
  pageId: {
    type: String,
    required: true
  },
  pageName: String,
  date: {
    type: Date,
    required: true
  },
  metrics: {
    followers: {
      type: Number,
      default: 0
    },
    engagement: {
      type: Number,
      default: 0
    },
    reach: {
      type: Number,
      default: 0
    },
    impressions: {
      type: Number,
      default: 0
    },
    postsPublished: {
      type: Number,
      default: 0
    },
    messagesReceived: {
      type: Number,
      default: 0
    },
    messagesReplied: {
      type: Number,
      default: 0
    },
    newLikes: {
      type: Number,
      default: 0
    },
    comments: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    }
  },
  topPosts: [{
    postId: String,
    facebookPostId: String,
    engagement: Number,
    reach: Number,
    likes: Number,
    comments: Number,
    shares: Number
  }],
  topSenders: [{
    senderId: String,
    senderName: String,
    messageCount: Number
  }],
  hourlyMetrics: [{
    hour: Number,
    messagesReceived: Number,
    postsPublished: Number
  }]
}, {
  timestamps: true
});

// Indexes
analyticsSchema.index({ pageId: 1, date: 1 }, { unique: true });
analyticsSchema.index({ date: -1 });

// Static method to get analytics for a date range
analyticsSchema.statics.getAnalyticsByDateRange = function(pageId, startDate, endDate) {
  return this.find({
    pageId,
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: 1 });
};

// Static method to get today's analytics
analyticsSchema.statics.getTodaysAnalytics = function(pageId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return this.findOne({
    pageId,
    date: today
  });
};

// Static method to update or create analytics
analyticsSchema.statics.updateAnalytics = async function(pageId, pageName, updateData) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const existing = await this.findOne({ pageId, date: today });
  
  if (existing) {
    // Update existing
    Object.keys(updateData.metrics).forEach(key => {
      if (updateData.metrics[key] !== undefined) {
        existing.metrics[key] += updateData.metrics[key] || 0;
      }
    });
    
    if (updateData.topPosts) {
      existing.topPosts = [...existing.topPosts, ...updateData.topPosts];
    }
    
    return existing.save();
  } else {
    // Create new
    return this.create({
      pageId,
      pageName,
      date: today,
      metrics: updateData.metrics || {},
      topPosts: updateData.topPosts || []
    });
  }
};

module.exports = mongoose.model('Analytics', analyticsSchema);
