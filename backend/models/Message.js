const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Message:
 *       type: object
 *       required:
 *         - senderId
 *         - content
 *         - pageId
 *       properties:
 *         senderId:
 *           type: string
 *           description: Facebook ID of the sender
 *         senderName:
 *           type: string
 *         content:
 *           type: string
 *           description: Message content
 *         pageId:
 *           type: string
 *           description: Facebook page ID
 *         attachments:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *               type:
 *                 type: string
 *         isRead:
 *           type: boolean
 *           default: false
 *         isReplied:
 *           type: boolean
 *           default: false
 *         replyContent:
 *           type: string
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const messageSchema = new mongoose.Schema({
  senderId: {
    type: String,
    required: true
  },
  senderName: String,
  senderProfilePic: String,
  content: {
    type: String,
    required: true
  },
  pageId: {
    type: String,
    required: true
  },
  pageName: String,
  attachments: [{
    url: String,
    type: {
      type: String,
      enum: ['image', 'video', 'audio', 'file']
    },
    name: String
  }],
  metadata: {
    messageId: String,
    threadId: String,
    timestamp: Date
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isReplied: {
    type: Boolean,
    default: false
  },
  replyContent: String,
  replyTimestamp: Date,
  tags: [String],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['new', 'read', 'replied', 'archived'],
    default: 'new'
  }
}, {
  timestamps: true
});

// Indexes
messageSchema.index({ pageId: 1, isRead: 1 });
messageSchema.index({ senderId: 1, pageId: 1 });
messageSchema.index({ status: 1, createdAt: -1 });

// Method to mark as read
messageSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.status = 'read';
  return this.save();
};

// Method to mark as replied
messageSchema.methods.markAsReplied = function(replyContent) {
  this.isReplied = true;
  this.replyContent = replyContent;
  this.replyTimestamp = new Date();
  this.status = 'replied';
  return this.save();
};

// Method to archive
messageSchema.methods.archive = function() {
  this.status = 'archived';
  return this.save();
};

// Static method to get unread messages
messageSchema.statics.getUnreadMessages = function(pageId) {
  return this.find({
    pageId,
    isRead: false
  }).sort({ createdAt: -1 });
};

// Static method to get messages by sender
messageSchema.statics.getMessagesBySender = function(senderId, pageId) {
  return this.find({
    senderId,
    pageId
  }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('Message', messageSchema);
