/**
 * Facebook Configuration for Multi-Account Management
 * Handles multiple Facebook accounts, pages, and groups per user
 */

module.exports = {
  // Facebook API Configuration
  apiVersion: 'v18.0',
  graphUrl: 'https://graph.facebook.com',
  
  // Required permissions for full functionality
  requiredPermissions: [
    'email',
    'public_profile',
    'pages_manage_posts',
    'pages_read_engagement',
    'pages_messaging',
    'pages_manage_metadata',
    'pages_read_user_content',
    'groups_access_member_info',
    'publish_to_groups',
    'business_management'
  ],
  
  // Scopes for OAuth
  oauthScopes: [
    'email',
    'public_profile',
    'pages_show_list',
    'pages_messaging',
    'pages_manage_posts',
    'pages_manage_engagement',
    'groups_access_member_info',
    'publish_to_groups'
  ].join(','),
  
  // Token types
  tokenTypes: {
    SHORT_LIVED: 'short_lived',
    LONG_LIVED: 'long_lived',
    NEVER_EXPIRING: 'never_expiring'
  },
  
  // Default settings for new Facebook accounts
  defaultAccountSettings: {
    autoPost: false,
    autoReply: false,
    autoArchive: false,
    notificationEnabled: true,
    maxPostsPerDay: 50,
    maxMessagesPerHour: 20
  },
  
  // Rate limits (Facebook API limits)
  rateLimits: {
    callsPerHour: 200,
    callsPerDay: 8000,
    postsPerHour: 200,
    messagesPerSecond: 10
  },
  
  // Error codes
  errorCodes: {
    INVALID_TOKEN: 'OAuthException',
    EXPIRED_TOKEN: 190,
    RATE_LIMITED: 4,
    PERMISSION_DENIED: 200
  }
};
