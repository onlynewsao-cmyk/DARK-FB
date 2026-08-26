const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Model - Extended for Multi-Facebook Account Management
 * 
 * Supports:
 * - Multiple Facebook accounts per user
 * - Multiple pages per Facebook account
 * - Multiple groups per Facebook account
 * - OAuth providers (Google, Facebook, GitHub)
 * - Anti-ban settings per user
 * - Custom settings
 */

const userSchema = new mongoose.Schema({
  // Basic user information
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    minlength: 8,
    select: false
  },
  
  // Authentication provider
  provider: {
    type: String,
    enum: ['local', 'google', 'facebook', 'github'],
    default: 'local'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  verificationTokenExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  
  // User role
  role: {
    type: String,
    enum: ['admin', 'user', 'moderator'],
    default: 'user'
  },
  
  // OAuth Providers
  google: {
    id: String,
    email: String,
    name: String,
    avatar: String,
    accessToken: String,
    refreshToken: String
  },
  
  facebook: {
    id: String,
    email: String,
    name: String,
    avatar: String,
    accessToken: String,
    refreshToken: String,
    tokenExpires: Date,
    tokenType: {
      type: String,
      enum: ['short_lived', 'long_lived', 'never_expiring'],
      default: 'short_lived'
    }
  },
  
  github: {
    id: String,
    email: String,
    username: String,
    name: String,
    avatar: String,
    accessToken: String
  },
  
  // Facebook Accounts - Main feature for multi-account management
  facebookAccounts: [{
    // Account identification
    accountId: {
      type: String,
      required: true
    },
    accountName: String,
    accountType: {
      type: String,
      enum: ['personal', 'business'],
      default: 'personal'
    },
    
    // Access tokens
    accessToken: {
      type: String,
      required: true
    },
    refreshToken: String,
    tokenExpires: Date,
    tokenType: {
      type: String,
      enum: ['short_lived', 'long_lived', 'never_expiring'],
      default: 'short_lived'
    },
    
    // Connected Pages
    pages: [{
      pageId: {
        type: String,
        required: true
      },
      pageName: String,
      pageAccessToken: String,
      pagePicture: String,
      fanCount: Number,
      category: String,
      permissions: [String],
      isConnected: {
        type: Boolean,
        default: true
      },
      connectedAt: {
        type: Date,
        default: Date.now
      },
      // Page-specific settings
      settings: {
        autoPost: {
          type: Boolean,
          default: false
        },
        autoReply: {
          type: Boolean,
          default: false
        },
        replyMessage: String,
        maxPostsPerDay: {
          type: Number,
          default: 50
        },
        notificationEnabled: {
          type: Boolean,
          default: true
        }
      }
    }],
    
    // Connected Groups
    groups: [{
      groupId: {
        type: String,
        required: true
      },
      groupName: String,
      groupPicture: String,
      privacy: String,
      memberCount: Number,
      isAdmin: {
        type: Boolean,
        default: false
      },
      isConnected: {
        type: Boolean,
        default: true
      },
      connectedAt: {
        type: Date,
        default: Date.now
      },
      // Group-specific settings
      settings: {
        autoPost: {
          type: Boolean,
          default: false
        },
        maxPostsPerDay: {
          type: Number,
          default: 50
        }
      }
    }],
    
    // Account settings
    settings: {
      defaultPage: String,
      defaultGroup: String,
      autoSelectDefault: {
        type: Boolean,
        default: true
      }
    },
    
    // Connection status
    isConnected: {
      type: Boolean,
      default: true
    },
    connectedAt: {
      type: Date,
      default: Date.now
    },
    lastSyncAt: Date
  }],
  
  // User settings
  settings: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    language: {
      type: String,
      default: 'pt'
    },
    timezone: {
      type: String,
      default: 'Africa/Luanda'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      facebook: {
        type: Boolean,
        default: true
      }
    },
    defaultDashboardView: {
      type: String,
      enum: ['overview', 'posts', 'messages', 'analytics'],
      default: 'overview'
    }
  },
  
  // Anti-ban settings per user
  antiBan: {
    enabled: {
      type: Boolean,
      default: true
    },
    maxPostsPerHour: {
      type: Number,
      default: 50
    },
    maxMessagesPerMinute: {
      type: Number,
      default: 20
    },
    randomDelay: {
      enabled: {
        type: Boolean,
        default: true
      },
      min: {
        type: Number,
        default: 1000
      },
      max: {
        type: Number,
        default: 5000
      }
    },
    userAgentRotation: {
      type: Boolean,
      default: true
    }
  },
  
  // Profile
  profilePicture: String,
  bio: String,
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  
  // Statistics
  stats: {
    totalPosts: {
      type: Number,
      default: 0
    },
    totalMessages: {
      type: Number,
      default: 0
    },
    totalPages: {
      type: Number,
      default: 0
    },
    totalGroups: {
      type: Number,
      default: 0
    },
    lastActivity: Date
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to add Facebook account
userSchema.methods.addFacebookAccount = function(accountData) {
  // Check if account already exists
  const existingIndex = this.facebookAccounts.findIndex(
    acc => acc.accountId === accountData.accountId
  );
  
  if (existingIndex >= 0) {
    // Update existing account
    this.facebookAccounts[existingIndex] = {
      ...this.facebookAccounts[existingIndex],
      ...accountData,
      isConnected: true,
      connectedAt: new Date()
    };
  } else {
    // Add new account
    this.facebookAccounts.push({
      ...accountData,
      isConnected: true,
      connectedAt: new Date()
    });
  }
  
  // Update stats
  this.stats.totalPages = this.facebookAccounts.reduce(
    (sum, acc) => sum + (acc.pages?.length || 0), 0
  );
  this.stats.totalGroups = this.facebookAccounts.reduce(
    (sum, acc) => sum + (acc.groups?.length || 0), 0
  );
  
  return this.save();
};

// Method to remove Facebook account
userSchema.methods.removeFacebookAccount = function(accountId) {
  this.facebookAccounts = this.facebookAccounts.filter(
    acc => acc.accountId !== accountId
  );
  
  // Update stats
  this.stats.totalPages = this.facebookAccounts.reduce(
    (sum, acc) => sum + (acc.pages?.length || 0), 0
  );
  this.stats.totalGroups = this.facebookAccounts.reduce(
    (sum, acc) => sum + (acc.groups?.length || 0), 0
  );
  
  return this.save();
};

// Method to add page to Facebook account
userSchema.methods.addPageToAccount = function(accountId, pageData) {
  const account = this.facebookAccounts.find(acc => acc.accountId === accountId);
  
  if (!account) {
    throw new Error('Facebook account not found');
  }
  
  // Check if page already exists
  const existingIndex = account.pages.findIndex(p => p.pageId === pageData.pageId);
  
  if (existingIndex >= 0) {
    account.pages[existingIndex] = {
      ...account.pages[existingIndex],
      ...pageData,
      isConnected: true,
      connectedAt: new Date()
    };
  } else {
    account.pages.push({
      ...pageData,
      isConnected: true,
      connectedAt: new Date()
    });
  }
  
  // Update stats
  this.stats.totalPages = this.facebookAccounts.reduce(
    (sum, acc) => sum + (acc.pages?.length || 0), 0
  );
  
  return this.save();
};

// Method to remove page from Facebook account
userSchema.methods.removePageFromAccount = function(accountId, pageId) {
  const account = this.facebookAccounts.find(acc => acc.accountId === accountId);
  
  if (!account) {
    throw new Error('Facebook account not found');
  }
  
  account.pages = account.pages.filter(p => p.pageId !== pageId);
  
  // Update stats
  this.stats.totalPages = this.facebookAccounts.reduce(
    (sum, acc) => sum + (acc.pages?.length || 0), 0
  );
  
  return this.save();
};

// Method to add group to Facebook account
userSchema.methods.addGroupToAccount = function(accountId, groupData) {
  const account = this.facebookAccounts.find(acc => acc.accountId === accountId);
  
  if (!account) {
    throw new Error('Facebook account not found');
  }
  
  // Check if group already exists
  const existingIndex = account.groups.findIndex(g => g.groupId === groupData.groupId);
  
  if (existingIndex >= 0) {
    account.groups[existingIndex] = {
      ...account.groups[existingIndex],
      ...groupData,
      isConnected: true,
      connectedAt: new Date()
    };
  } else {
    account.groups.push({
      ...groupData,
      isConnected: true,
      connectedAt: new Date()
    });
  }
  
  // Update stats
  this.stats.totalGroups = this.facebookAccounts.reduce(
    (sum, acc) => sum + (acc.groups?.length || 0), 0
  );
  
  return this.save();
};

// Method to remove group from Facebook account
userSchema.methods.removeGroupFromAccount = function(accountId, groupId) {
  const account = this.facebookAccounts.find(acc => acc.accountId === accountId);
  
  if (!account) {
    throw new Error('Facebook account not found');
  }
  
  account.groups = account.groups.filter(g => g.groupId !== groupId);
  
  // Update stats
  this.stats.totalGroups = this.facebookAccounts.reduce(
    (sum, acc) => sum + (acc.groups?.length || 0), 0
  );
  
  return this.save();
};

// Method to get all connected pages
userSchema.methods.getAllPages = function() {
  return this.facebookAccounts.flatMap(acc => 
    acc.pages.filter(p => p.isConnected)
  );
};

// Method to get all connected groups
userSchema.methods.getAllGroups = function() {
  return this.facebookAccounts.flatMap(acc => 
    acc.groups.filter(g => g.isConnected)
  );
};

// Method to get page by ID
userSchema.methods.getPageById = function(pageId) {
  for (const account of this.facebookAccounts) {
    const page = account.pages.find(p => p.pageId === pageId);
    if (page) return page;
  }
  return null;
};

// Method to get group by ID
userSchema.methods.getGroupById = function(groupId) {
  for (const account of this.facebookAccounts) {
    const group = account.groups.find(g => g.groupId === groupId);
    if (group) return group;
  }
  return null;
};

// Method to get account by page ID
userSchema.methods.getAccountByPageId = function(pageId) {
  for (const account of this.facebookAccounts) {
    if (account.pages.some(p => p.pageId === pageId)) {
      return account;
    }
  }
  return null;
};

// Method to get account by group ID
userSchema.methods.getAccountByGroupId = function(groupId) {
  for (const account of this.facebookAccounts) {
    if (account.groups.some(g => g.groupId === groupId)) {
      return account;
    }
  }
  return null;
};

// Method to set default page
userSchema.methods.setDefaultPage = function(pageId) {
  // Check if page exists
  const page = this.getPageById(pageId);
  if (!page) {
    throw new Error('Page not found');
  }
  
  // Find the account that has this page
  const account = this.getAccountByPageId(pageId);
  if (!account) {
    throw new Error('Account not found');
  }
  
  // Update settings
  if (!this.settings) this.settings = {};
  this.settings.defaultPage = pageId;
  
  // Update account settings
  account.settings = account.settings || {};
  account.settings.defaultPage = pageId;
  
  return this.save();
};

// Method to set default group
userSchema.methods.setDefaultGroup = function(groupId) {
  const group = this.getGroupById(groupId);
  if (!group) {
    throw new Error('Group not found');
  }
  
  const account = this.getAccountByGroupId(groupId);
  if (!account) {
    throw new Error('Account not found');
  }
  
  if (!this.settings) this.settings = {};
  this.settings.defaultGroup = groupId;
  
  account.settings = account.settings || {};
  account.settings.defaultGroup = groupId;
  
  return this.save();
};

// Method to update anti-ban settings
userSchema.methods.updateAntiBanSettings = function(newSettings) {
  this.antiBan = { ...this.antiBan, ...newSettings };
  return this.save();
};

// Method to update user settings
userSchema.methods.updateSettings = function(newSettings) {
  this.settings = { ...this.settings, ...newSettings };
  return this.save();
};

// Static method to find user by Facebook account
userSchema.statics.findByFacebookAccount = async function(accountId) {
  return this.findOne({ 
    'facebookAccounts.accountId': accountId 
  });
};

// Static method to find user by page
userSchema.statics.findByPageId = async function(pageId) {
  return this.findOne({ 
    'facebookAccounts.pages.pageId': pageId 
  });
};

// Static method to find user by group
userSchema.statics.findByGroupId = async function(groupId) {
  return this.findOne({ 
    'facebookAccounts.groups.groupId': groupId 
  });
};

// Static method to find users with active Facebook accounts
userSchema.statics.findWithActiveAccounts = async function() {
  return this.find({ 
    'facebookAccounts.isConnected': true 
  });
};

// Indexes for better query performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ 'facebookAccounts.accountId': 1 });
userSchema.index({ 'facebookAccounts.pages.pageId': 1 });
userSchema.index({ 'facebookAccounts.groups.groupId': 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

module.exports = mongoose.model('User', userSchema);
