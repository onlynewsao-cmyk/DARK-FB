#!/usr/bin/env node

/**
 * Facebook Bot - Scheduled Post Publisher
 * This script runs every minute to check and publish scheduled posts
 */

require('dotenv').config();
const mongoose = require('mongoose');
const FacebookService = require('../backend/services/facebookService');
const User = require('../backend/models/User');
const Post = require('../backend/models/Post');
const ScheduledPost = require('../backend/models/ScheduledPost');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/scheduler.log' })
  ]
});

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Main function to publish scheduled posts
async function publishScheduledPosts() {
  try {
    logger.info('Checking for scheduled posts to publish...');
    
    const scheduledPosts = await ScheduledPost.getPostsToPublish();
    
    if (scheduledPosts.length === 0) {
      logger.info('No scheduled posts to publish');
      return;
    }
    
    logger.info(`Found ${scheduledPosts.length} scheduled posts to publish`);
    
    for (const scheduled of scheduledPosts) {
      try {
        // Skip if not pending
        if (scheduled.status !== 'pending') {
          logger.info(`Skipping scheduled post ${scheduled._id} - status: ${scheduled.status}`);
          continue;
        }
        
        // Get the post
        const post = await Post.findById(scheduled.postId);
        if (!post) {
          logger.warn(`Post not found for scheduled post ${scheduled._id}`);
          await scheduled.markAsFailed('Post not found');
          continue;
        }
        
        // Get user and Facebook account
        const user = await User.findById(scheduled.userId);
        if (!user) {
          logger.warn(`User not found for scheduled post ${scheduled._id}`);
          await scheduled.markAsFailed('User not found');
          continue;
        }
        
        const facebookAccount = user.facebookAccounts.find(
          acc => acc.pageId === scheduled.target.id
        );
        
        if (!facebookAccount) {
          logger.warn(`Facebook account not found for scheduled post ${scheduled._id}`);
          await scheduled.markAsFailed('Facebook account not connected');
          continue;
        }
        
        logger.info(`Publishing scheduled post ${scheduled._id} to ${scheduled.target.type} ${scheduled.target.id}`);
        
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
        
        if (!facebookResponse?.id) {
          throw new Error('Failed to publish post - no response from Facebook');
        }
        
        // Update post
        post.facebookPostId = facebookResponse.id;
        post.status = 'posted';
        post.postedAt = new Date();
        await post.save();
        
        // Update scheduled post
        await scheduled.markAsPublished(facebookResponse.id);
        
        logger.info(`Successfully published scheduled post ${scheduled._id}`);
        
        // Handle recurrence
        if (scheduled.recurrence.type !== 'once') {
          await handleRecurrence(scheduled);
        }
        
      } catch (error) {
        logger.error(`Error publishing scheduled post ${scheduled._id}:`, error);
        await scheduled.markAsFailed(error.message);
      }
    }
    
  } catch (error) {
    logger.error('Error in publishScheduledPosts:', error);
  }
}

// Handle recurrence for scheduled posts
async function handleRecurrence(scheduled) {
  const now = new Date();
  const { type, interval, endDate, daysOfWeek, dayOfMonth } = scheduled.recurrence;
  
  // Check if we should continue
  if (endDate && new Date(endDate) <= now) {
    logger.info(`Recurrence ended for scheduled post ${scheduled._id}`);
    return;
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
    
    logger.info(`Created next recurrence for scheduled post ${scheduled._id} at ${nextDate}`);
  }
}

// Main execution
(async () => {
  try {
    await connectDB();
    await publishScheduledPosts();
    logger.info('Scheduler completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Scheduler failed:', error);
    process.exit(1);
  }
})();
