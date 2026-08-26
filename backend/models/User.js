const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: User's full name
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         password:
 *           type: string
 *           format: password
 *           description: User's password (hashed)
 *         provider:
 *           type: string
 *           enum: [local, google, facebook, github]
 *           description: Authentication provider
 *         role:
 *           type: string
 *           enum: [admin, user, moderator]
 *           default: user
 *         isVerified:
 *           type: boolean
 *           default: false
 *         google:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             email:
 *               type: string
 *             name:
 *               type: string
 *             avatar:
 *               type: string
 *         facebook:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             email:
 *               type: string
 *             name:
 *               type: string
 *             avatar:
 *               type: string
 *             accessToken:
 *               type: string
 *         github:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             email:
 *               type: string
 *             username:
 *               type: string
 *             name:
 *               type: string
 *             avatar:
 *               type: string
 *             accessToken:
 *               type: string
 *         facebookAccounts:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               pageId:
 *                 type: string
 *               pageName:
 *                 type: string
 *               accessToken:
 *                 type: string
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *         settings:
 *           type: object
 *           properties:
 *             theme:
 *               type: string
 *               enum: [light, dark, system]
 *               default: system
 *             language:
 *               type: string
 *               default: pt
 *             timezone:
 *               type: string
 *               default: Africa/Luanda
 *         lastLogin:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const userSchema = new mongoose.Schema({
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
  provider: {
    type: String,
    enum: ['local', 'google', 'facebook', 'github'],
    default: 'local'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
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
    avatar: String
  },
  facebook: {
    id: String,
    email: String,
    name: String,
    avatar: String,
    accessToken: String
  },
  github: {
    id: String,
    email: String,
    username: String,
    name: String,
    avatar: String,
    accessToken: String
  },
  // Facebook Pages and Groups
  facebookAccounts: [{
    pageId: String,
    pageName: String,
    accessToken: String,
    pageAccessToken: String,
    permissions: [String],
    isConnected: {
      type: Boolean,
      default: true
    }
  }],
  // User Settings
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
      }
    }
  },
  profilePicture: String,
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  // Anti-ban settings
  antiBan: {
    maxPostsPerHour: {
      type: Number,
      default: 50
    },
    maxMessagesPerMinute: {
      type: Number,
      default: 20
    },
    randomDelayEnabled: {
      type: Boolean,
      default: true
    },
    userAgentRotation: {
      type: Boolean,
      default: true
    }
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
  // Check if already exists
  const existingIndex = this.facebookAccounts.findIndex(
    acc => acc.pageId === accountData.pageId
  );
  
  if (existingIndex >= 0) {
    this.facebookAccounts[existingIndex] = accountData;
  } else {
    this.facebookAccounts.push(accountData);
  }
  return this.save();
};

// Method to remove Facebook account
userSchema.methods.removeFacebookAccount = function(pageId) {
  this.facebookAccounts = this.facebookAccounts.filter(
    account => account.pageId !== pageId
  );
  return this.save();
};

// Method to get connected pages
userSchema.methods.getConnectedPages = function() {
  return this.facebookAccounts.filter(acc => acc.isConnected !== false);
};

// Method to update settings
userSchema.methods.updateSettings = function(newSettings) {
  this.settings = { ...this.settings, ...newSettings };
  return this.save();
};

// Static method to find by email or provider ID
userSchema.statics.findByEmailOrProvider = async function(email, provider, providerId) {
  return this.findOne({
    $or: [
      { email },
      { [`${provider}.id`]: providerId }
    ]
  });
};

// Static method to find or create user from OAuth
userSchema.statics.findOrCreateFromOAuth = async function(provider, profile) {
  let user = await this.findOne({ [`${provider}.id`]: profile.id });
  
  if (!user) {
    // Check if email exists
    user = await this.findOne({ email: profile.email });
    
    if (user) {
      // Link provider to existing user
      user[provider] = {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        avatar: profile.avatar
      };
      await user.save();
    } else {
      // Create new user
      user = new this({
        name: profile.name,
        email: profile.email,
        [provider]: {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          avatar: profile.avatar
        },
        provider: provider,
        isVerified: true
      });
      await user.save();
    }
  }
  
  return user;
};

module.exports = mongoose.model('User', userSchema);
