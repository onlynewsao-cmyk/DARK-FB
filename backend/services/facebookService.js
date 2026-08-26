const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

class FacebookService {
  constructor(accessToken, apiVersion = 'v18.0') {
    this.accessToken = accessToken;
    this.apiVersion = apiVersion;
    this.baseUrl = `https://graph.facebook.com/${apiVersion}`;
  }

  /**
   * Make a request to Facebook Graph API
   */
  async _request(method, endpoint, params = {}, data = null) {
    try {
      const config = {
        method: method.toLowerCase(),
        url: `${this.baseUrl}${endpoint}`,
        params: {
          access_token: this.accessToken,
          ...params
        }
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return response.data;
    } catch (error) {
      console.error('Facebook API Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || error.message);
    }
  }

  /**
   * Get Facebook page info
   */
  async getPageInfo(pageId, fields = ['id', 'name', 'access_token', 'picture']) {
    return this._request('GET', `/${pageId}`, { fields: fields.join(',') });
  }

  /**
   * Get list of pages the user manages
   */
  async getUserPages() {
    return this._request('GET', '/me/accounts', {
      fields: 'id,name,access_token,picture,fan_count'
    });
  }

  /**
   * Get list of groups the user manages
   */
  async getUserGroups() {
    return this._request('GET', '/me/groups', {
      fields: 'id,name,picture,privacy'
    });
  }

  /**
   * Post to a Facebook page
   */
  async postToPage(pageId, message, link = null, place = null, tags = []) {
    const data = { message };
    
    if (link) data.link = link;
    if (place) data.place = place;
    if (tags && tags.length > 0) data.tags = tags;

    return this._request('POST', `/${pageId}/feed`, {}, data);
  }

  /**
   * Post to a Facebook group
   */
  async postToGroup(groupId, message, link = null) {
    const data = { message };
    
    if (link) data.link = link;

    return this._request('POST', `/${groupId}/feed`, {}, data);
  }

  /**
   * Upload photo to page
   */
  async uploadPhoto(pageId, imagePath, caption = '') {
    try {
      const form = new FormData();
      form.append('source', fs.createReadStream(imagePath));
      form.append('caption', caption);

      const response = await axios.post(
        `${this.baseUrl}/${pageId}/photos`,
        form,
        {
          params: {
            access_token: this.accessToken
          },
          headers: {
            ...form.getHeaders()
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Upload Photo Error:', error);
      throw error;
    }
  }

  /**
   * Upload photo from URL
   */
  async uploadPhotoFromUrl(pageId, imageUrl, caption = '') {
    return this._request('POST', `/${pageId}/photos`, {}, {
      url: imageUrl,
      caption: caption
    });
  }

  /**
   * Upload video to page
   */
  async uploadVideo(pageId, videoPath, description = '', title = '') {
    try {
      const form = new FormData();
      form.append('source', fs.createReadStream(videoPath));
      form.append('description', description);
      form.append('title', title);

      const response = await axios.post(
        `${this.baseUrl}/${pageId}/videos`,
        form,
        {
          params: {
            access_token: this.accessToken
          },
          headers: {
            ...form.getHeaders()
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Upload Video Error:', error);
      throw error;
    }
  }

  /**
   * Post with multiple media (album)
   */
  async postAlbum(pageId, message, mediaUrls = []) {
    const children = mediaUrls.map(url => ({ url }));
    
    return this._request('POST', `/${pageId}/feed`, {}, {
      message,
      attached_media: children
    });
  }

  /**
   * Get page posts
   */
  async getPagePosts(pageId, limit = 10, fields = []) {
    const defaultFields = ['id', 'message', 'created_time', 'updated_time', 'likes.summary(true)', 
                          'comments.summary(true)', 'shares', 'reach', 'impressions'];
    
    return this._request('GET', `/${pageId}/posts`, {
      limit,
      fields: [...defaultFields, ...fields].join(',')
    });
  }

  /**
   * Get post insights
   */
  async getPostInsights(postId, metrics = ['engagement', 'reach', 'impressions']) {
    return this._request('GET', `/${postId}/insights`, {
      metric: metrics.join(',')
    });
  }

  /**
   * Delete a post
   */
  async deletePost(postId) {
    return this._request('DELETE', `/${postId}`);
  }

  /**
   * Edit a post
   */
  async editPost(postId, message) {
    return this._request('POST', `/${postId}`, {}, { message });
  }

  /**
   * Get page messages (Messenger)
   */
  async getPageMessages(pageId, limit = 10) {
    return this._request('GET', `/${pageId}/conversations`, {
      limit,
      fields: 'id,senders,updated_time,unread_count,message_count'
    });
  }

  /**
   * Get conversation messages
   */
  async getConversationMessages(conversationId, limit = 10) {
    return this._request('GET', `/${conversationId}/messages`, {
      limit,
      fields: 'id,created_time,from,message,attachments'
    });
  }

  /**
   * Send message via Messenger
   */
  async sendMessage(pageId, recipientId, message, attachment = null) {
    const data = {
      recipient: { id: recipientId },
      message: { text: message }
    };

    if (attachment) {
      data.message.attachment = attachment;
    }

    return this._request('POST', `/${pageId}/messages`, {}, data);
  }

  /**
   * Send message with image
   */
  async sendMessageWithImage(pageId, recipientId, message, imageUrl) {
    return this.sendMessage(pageId, recipientId, message, {
      type: 'image',
      payload: { url: imageUrl }
    });
  }

  /**
   * Send message with buttons
   */
  async sendMessageWithButtons(pageId, recipientId, text, buttons = []) {
    return this._request('POST', `/${pageId}/messages`, {}, {
      recipient: { id: recipientId },
      message: {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'button',
            text: text,
            buttons: buttons.map(btn => ({
              type: btn.type || 'web_url',
              url: btn.url,
              title: btn.title
            }))
          }
        }
      }
    });
  }

  /**
   * Send quick replies
   */
  async sendQuickReplies(pageId, recipientId, text, quickReplies = []) {
    return this._request('POST', `/${pageId}/messages`, {}, {
      recipient: { id: recipientId },
      message: {
        text: text,
        quick_replies: quickReplies.map(qr => ({
          content_type: 'text',
          title: qr.title,
          payload: qr.payload || qr.title
        }))
      }
    });
  }

  /**
   * Mark message as read
   */
  async markMessageAsRead(messageId) {
    return this._request('POST', `/${messageId}/reads`, {}, {
      recipient: { id: 'me' }
    });
  }

  /**
   * Get page insights
   */
  async getPageInsights(pageId, metrics = ['page_fans', 'page_engagement', 'page_reach']) {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    return this._request('GET', `/${pageId}/insights`, {
      metric: metrics.join(','),
      period: 'day',
      since: yesterday,
      until: today
    });
  }

  /**
   * Get page followers count
   */
  async getPageFollowers(pageId) {
    return this._request('GET', `/${pageId}`, {
      fields: 'fan_count'
    });
  }

  /**
   * Get group members
   */
  async getGroupMembers(groupId, limit = 10) {
    return this._request('GET', `/${groupId}/members`, {
      limit,
      fields: 'id,name,picture'
    });
  }

  /**
   * Setup webhook
   */
  async setupWebhook(callbackUrl, verifyToken) {
    // This is typically done through Facebook Developer Dashboard
    // But we can verify the setup
    return {
      success: true,
      message: 'Webhook should be configured in Facebook Developer Dashboard',
      callbackUrl,
      verifyToken
    };
  }

  /**
   * Verify webhook challenge
   */
  verifyWebhookChallenge(mode, token, challenge) {
    if (mode === 'subscribe' && token === process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN) {
      return challenge;
    }
    return null;
  }

  /**
   * Handle webhook events
   */
  async handleWebhookEvent(event) {
    const { type, data } = event;

    switch (type) {
      case 'message':
        return this.handleMessageEvent(data);
      case 'post':
        return this.handlePostEvent(data);
      case 'reaction':
        return this.handleReactionEvent(data);
      case 'comment':
        return this.handleCommentEvent(data);
      default:
        console.log('Unhandled event type:', type);
        return null;
    }
  }

  async handleMessageEvent(data) {
    // Handle incoming message
    const { message, sender, recipient } = data;
    
    return {
      type: 'message',
      data: {
        message,
        sender,
        recipient,
        timestamp: new Date().toISOString()
      }
    };
  }

  async handlePostEvent(data) {
    // Handle post events (new post, edit, delete)
    return {
      type: 'post',
      data
    };
  }

  async handleReactionEvent(data) {
    // Handle reaction events
    return {
      type: 'reaction',
      data
    };
  }

  async handleCommentEvent(data) {
    // Handle comment events
    return {
      type: 'comment',
      data
    };
  }

  /**
   * Get long-lived access token
   */
  async getLongLivedToken(shortLivedToken) {
    return this._request('GET', '/oauth/access_token', {
      grant_type: 'fb_exchange_token',
      client_id: process.env.FACEBOOK_APP_ID,
      client_secret: process.env.FACEBOOK_APP_SECRET,
      fb_exchange_token: shortLivedToken
    });
  }

  /**
   * Debug access token
   */
  async debugToken(accessToken) {
    return this._request('GET', '/debug_token', {
      input_token: accessToken
    });
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId, fields = ['id', 'name', 'email', 'picture']) {
    return this._request('GET', `/${userId}`, { fields: fields.join(',') });
  }

  /**
   * Search for pages
   */
  async searchPages(query, limit = 5) {
    return this._request('GET', '/search', {
      q: query,
      type: 'page',
      limit
    });
  }

  /**
   * Search for groups
   */
  async searchGroups(query, limit = 5) {
    return this._request('GET', '/search', {
      q: query,
      type: 'group',
      limit
    });
  }
}

module.exports = FacebookService;
