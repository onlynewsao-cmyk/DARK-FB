const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     ScheduledPost:
 *       type: object
 *       required:
 *         - postId
 *         - scheduleTime
 *       properties:
 *         postId:
 *           type: string
 *           description: Reference to the post
 *         scheduleTime:
 *           type: string
 *           format: date-time
 *           description: When the post should be published
 *         userId:
 *           type: string
 *         target:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *               enum: [page, group, channel]
 *             id:
 *               type: string
 *         status:
 *           type: string
 *           enum: [pending, published, cancelled, failed]
 *         recurrence:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *               enum: [once, daily, weekly, monthly]
 *             interval:
 *               type: number
 *             endDate:
 *               type: string
 *               format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const scheduledPostSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scheduleTime: {
    type: Date,
    required: true
  },
  target: {
    type: {
      type: String,
      enum: ['page', 'group', 'channel'],
      required: true
    },
    id: {
      type: String,
      required: true
    },
    name: String
  },
  status: {
    type: String,
    enum: ['pending', 'published', 'cancelled', 'failed'],
    default: 'pending'
  },
  recurrence: {
    type: {
      type: String,
      enum: ['once', 'daily', 'weekly', 'monthly'],
      default: 'once'
    },
    interval: {
      type: Number,
      default: 1
    },
    endDate: Date,
    daysOfWeek: [Number], // 0-6 (Sunday-Saturday)
    dayOfMonth: Number
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  publishedAt: Date,
  publishedPostId: String,
  errorMessage: String,
  retryCount: {
    type: Number,
    default: 0
  },
  maxRetries: {
    type: Number,
    default: 3
  }
}, {
  timestamps: true
});

// Indexes
scheduledPostSchema.index({ scheduleTime: 1, status: 1 });
scheduledPostSchema.index({ userId: 1, status: 1 });
scheduledPostSchema.index({ 'target.id': 1, scheduleTime: 1 });

// Method to cancel schedule
scheduledPostSchema.methods.cancel = function() {
  this.status = 'cancelled';
  return this.save();
};

// Method to mark as published
scheduledPostSchema.methods.markAsPublished = function(publishedPostId) {
  this.status = 'published';
  this.publishedAt = new Date();
  this.publishedPostId = publishedPostId;
  return this.save();
};

// Method to mark as failed
scheduledPostSchema.methods.markAsFailed = function(errorMessage) {
  this.status = 'failed';
  this.errorMessage = errorMessage;
  this.retryCount += 1;
  
  // If max retries reached, cancel
  if (this.retryCount >= this.maxRetries) {
    this.status = 'cancelled';
  }
  
  return this.save();
};

// Static method to get posts to publish now
scheduledPostSchema.statics.getPostsToPublish = function() {
  const now = new Date();
  return this.find({
    status: 'pending',
    scheduleTime: { $lte: now },
    $or: [
      { recurrence: { type: 'once' } },
      { 
        recurrence: { type: { $ne: 'once' } },
        $or: [
          { 'recurrence.endDate': { $exists: false } },
          { 'recurrence.endDate': { $gte: now } }
        ]
      }
    ]
  }).populate('postId');
};

// Static method to get upcoming scheduled posts
scheduledPostSchema.statics.getUpcomingPosts = function(userId, limit = 10) {
  return this.find({
    userId,
    status: 'pending',
    scheduleTime: { $gte: new Date() }
  }).sort({ scheduleTime: 1 }).limit(limit).populate('postId');
};

module.exports = mongoose.model('ScheduledPost', scheduledPostSchema);
