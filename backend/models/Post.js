const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Post:
 *       type: object
 *       required:
 *         - content
 *         - user
 *       properties:
 *         content:
 *           type: string
 *           description: The content of the post
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *         target:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *               enum: [page, group, channel]
 *             id:
 *               type: string
 *             name:
 *               type: string
 *         media:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [image, video, audio]
 *         scheduledAt:
 *           type: string
 *           format: date-time
 *         postedAt:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *           enum: [draft, scheduled, posted, failed]
 *           default: draft
 *         facebookPostId:
 *           type: string
 *         stats:
 *           type: object
 *           properties:
 *             likes:
 *               type: number
 *             comments:
 *               type: number
 *             shares:
 *               type: number
 *             reach:
 *               type: number
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const postSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Post content is required']
  },
  user: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: String
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
  media: [{
    url: String,
    type: {
      type: String,
      enum: ['image', 'video', 'audio']
    },
    thumbnail: String,
    caption: String
  }],
  scheduledAt: {
    type: Date
  },
  postedAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'posted', 'failed'],
    default: 'draft'
  },
  facebookPostId: String,
  stats: {
    likes: {
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
    },
    reach: {
      type: Number,
      default: 0
    },
    impressions: {
      type: Number,
      default: 0
    }
  },
  settings: {
    autoReply: {
      type: Boolean,
      default: false
    },
    replyMessage: String,
    tags: [String]
  },
  errorMessage: String
}, {
  timestamps: true
});

// Indexes for better query performance
postSchema.index({ 'user.id': 1, 'target.id': 1 });
postSchema.index({ status: 1, scheduledAt: 1 });
postSchema.index({ 'target.type': 1, 'target.id': 1 });

// Method to mark as posted
postSchema.methods.markAsPosted = function(facebookPostId) {
  this.status = 'posted';
  this.facebookPostId = facebookPostId;
  this.postedAt = new Date();
  return this.save();
};

// Method to mark as failed
postSchema.methods.markAsFailed = function(errorMessage) {
  this.status = 'failed';
  this.errorMessage = errorMessage;
  return this.save();
};

// Static method to get posts by status
postSchema.statics.getPostsByStatus = function(status, userId) {
  return this.find({ 
    'user.id': userId, 
    status 
  }).sort({ createdAt: -1 });
};

// Static method to get scheduled posts
postSchema.statics.getScheduledPosts = function() {
  return this.find({
    status: 'scheduled',
    scheduledAt: { $lte: new Date() }
  });
};

module.exports = mongoose.model('Post', postSchema);
