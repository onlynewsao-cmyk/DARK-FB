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
 *         - password
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
 *         role:
 *           type: string
 *           enum: [admin, user]
 *           default: user
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
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  facebookAccounts: [{
    pageId: String,
    pageName: String,
    accessToken: String,
    permissions: [String],
    pageAccessToken: String,
    groupAccessToken: String
  }],
  profilePicture: String,
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to add Facebook account
userSchema.methods.addFacebookAccount = function(accountData) {
  this.facebookAccounts.push(accountData);
  return this.save();
};

// Method to remove Facebook account
userSchema.methods.removeFacebookAccount = function(pageId) {
  this.facebookAccounts = this.facebookAccounts.filter(
    account => account.pageId !== pageId
  );
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
