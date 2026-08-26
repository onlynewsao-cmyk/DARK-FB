const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendEmail } = require('../services/emailService');

class AuthController {
  /**
   * @swagger
   * /api/auth/register:
   *   post:
   *     summary: Register a new user
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - email
   *               - password
   *             properties:
   *               name:
   *                 type: string
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *                 format: password
   *                 minLength: 8
   *               role:
   *                 type: string
   *                 enum: [admin, user, moderator]
   *                 default: user
   *     responses:
   *       201:
   *         description: User registered successfully
   */
  async register(req, res) {
    try {
      const { name, email, password, role = 'user' } = req.body;
      
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          error: 'User already exists with this email'
        });
      }
      
      // Create new user
      const user = new User({
        name,
        email,
        password,
        role,
        provider: 'local'
      });
      
      await user.save();
      
      // Generate token
      const token = this.generateToken(user._id);
      
      // Generate verification token
      const verificationToken = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      // Send verification email (if email service is configured)
      if (process.env.SMTP_HOST) {
        const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
        await sendEmail({
          to: user.email,
          subject: 'Verify Your Email - DARK-FB',
          html: `
            <h1>Welcome to DARK-FB</h1>
            <p>Please verify your email by clicking the link below:</p>
            <a href="${verificationUrl}">Verify Email</a>
            <p>This link will expire in 7 days.</p>
          `
        });
      }
      
      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          provider: user.provider,
          isVerified: user.isVerified
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/auth/login:
   *   post:
   *     summary: Login user
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *                 format: password
   *     responses:
   *       200:
   *         description: Login successful
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;
      
      // Find user
      const user = await User.findOne({ email }).select('+password');
      
      if (!user) {
        return res.status(401).json({
          error: 'Invalid credentials'
        });
      }
      
      // Check password
      const isMatch = await user.comparePassword(password);
      
      if (!isMatch) {
        return res.status(401).json({
          error: 'Invalid credentials'
        });
      }
      
      // Check if user is active
      if (!user.isActive) {
        return res.status(403).json({
          error: 'Account is disabled'
        });
      }
      
      // Generate token
      const token = this.generateToken(user._id);
      
      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          provider: user.provider,
          isVerified: user.isVerified,
          settings: user.settings,
          facebookAccounts: user.facebookAccounts,
          lastLogin: user.lastLogin
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/auth/me:
   *   get:
   *     summary: Get current user
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Current user data
   */
  async getMe(req, res) {
    try {
      const user = await User.findById(req.user._id).select('-password');
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/auth/refresh:
   *   post:
   *     summary: Refresh access token
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: New access token
   */
  async refreshToken(req, res) {
    try {
      const token = this.generateToken(req.user._id);
      
      res.json({ token });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/auth/forgot-password:
   *   post:
   *     summary: Request password reset
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *     responses:
   *       200:
   *         description: Password reset email sent
   */
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      
      const user = await User.findOne({ email });
      
      if (!user) {
        // Don't reveal that user doesn't exist
        return res.json({
          message: 'If this email exists in our system, a reset link has been sent'
        });
      }
      
      // Generate reset token
      const resetToken = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      // Save reset token to user
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
      await user.save();
      
      // Send reset email
      if (process.env.SMTP_HOST) {
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
        await sendEmail({
          to: user.email,
          subject: 'Password Reset - DARK-FB',
          html: `
            <h1>Password Reset</h1>
            <p>You requested a password reset. Click the link below to reset your password:</p>
            <a href="${resetUrl}">Reset Password</a>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
          `
        });
      }
      
      res.json({
        message: 'Password reset link sent to your email'
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/auth/reset-password:
   *   post:
   *     summary: Reset password
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - token
   *               - newPassword
   *             properties:
   *               token:
   *                 type: string
   *               newPassword:
   *                 type: string
   *                 format: password
   *                 minLength: 8
   *     responses:
   *       200:
   *         description: Password reset successfully
   */
  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return res.status(400).json({ error: 'Invalid token' });
      }
      
      // Check if token expired
      if (user.resetPasswordExpires && user.resetPasswordExpires < new Date()) {
        return res.status(400).json({ error: 'Token expired' });
      }
      
      // Update password
      user.password = newPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      
      // Generate new token
      const newToken = this.generateToken(user._id);
      
      res.json({
        message: 'Password reset successfully',
        token: newToken
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/auth/change-password:
   *   post:
   *     summary: Change password
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - currentPassword
   *               - newPassword
   *             properties:
   *               currentPassword:
   *                 type: string
   *                 format: password
   *               newPassword:
   *                 type: string
   *                 format: password
   *                 minLength: 8
   *     responses:
   *       200:
   *         description: Password changed successfully
   */
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      
      const user = await User.findById(req.user._id).select('+password');
      
      // Check current password
      const isMatch = await user.comparePassword(currentPassword);
      
      if (!isMatch) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
      
      // Update password
      user.password = newPassword;
      await user.save();
      
      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/auth/logout:
   *   post:
   *     summary: Logout user
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Logout successful
   */
  async logout(req, res) {
    try {
      // In JWT, logout is handled client-side by removing the token
      // We can add token to a blacklist if needed
      
      res.json({ message: 'Logout successful' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/auth/settings:
   *   get:
   *     summary: Get user settings
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User settings
   */
  async getSettings(req, res) {
    try {
      const user = await User.findById(req.user._id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({
        settings: user.settings,
        antiBan: user.antiBan
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/auth/settings:
   *   put:
   *     summary: Update user settings
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               theme:
   *                 type: string
   *                 enum: [light, dark, system]
   *               language:
   *                 type: string
   *               timezone:
   *                 type: string
   *               notifications:
   *                 type: object
   *                 properties:
   *                   email:
   *                     type: boolean
   *                   push:
   *                     type: boolean
   *     responses:
   *       200:
   *         description: Settings updated
   */
  async updateSettings(req, res) {
    try {
      const { settings, antiBan } = req.body;
      
      const user = await User.findById(req.user._id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      if (settings) {
        user.settings = { ...user.settings, ...settings };
      }
      
      if (antiBan) {
        user.antiBan = { ...user.antiBan, ...antiBan };
      }
      
      await user.save();
      
      res.json({
        message: 'Settings updated successfully',
        settings: user.settings,
        antiBan: user.antiBan
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/auth/verify-email:
   *   get:
   *     summary: Verify email
   *     tags: [Authentication]
   *     parameters:
   *       - in: query
   *         name: token
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Email verified
   */
  async verifyEmail(req, res) {
    try {
      const { token } = req.query;
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return res.status(400).json({ error: 'Invalid token' });
      }
      
      user.isVerified = true;
      await user.save();
      
      res.json({ message: 'Email verified successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Provider connection methods
  async connectGoogle(req, res) {
    try {
      // This would be handled by OAuth, but we can manually connect
      const { accessToken } = req.body;
      
      // Get user profile from Google
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      
      const profile = await response.json();
      
      const user = await User.findById(req.user._id);
      
      user.google = {
        id: profile.sub,
        email: profile.email,
        name: profile.name,
        avatar: profile.picture
      };
      
      await user.save();
      
      res.json({
        message: 'Google account connected',
        google: user.google
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async connectFacebook(req, res) {
    try {
      const { accessToken } = req.body;
      
      // Get user profile from Facebook
      const response = await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`);
      const profile = await response.json();
      
      const user = await User.findById(req.user._id);
      
      user.facebook = {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        avatar: profile.picture?.data?.url,
        accessToken: accessToken
      };
      
      await user.save();
      
      res.json({
        message: 'Facebook account connected',
        facebook: user.facebook
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async connectGitHub(req, res) {
    try {
      const { accessToken } = req.body;
      
      // Get user profile from GitHub
      const response = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `token ${accessToken}`
        }
      });
      const profile = await response.json();
      
      // Get email
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `token ${accessToken}`
        }
      });
      const emails = await emailResponse.json();
      const primaryEmail = emails.find(e => e.primary)?.email || profile.email || `${profile.id}@github.com`;
      
      const user = await User.findById(req.user._id);
      
      user.github = {
        id: profile.id,
        email: primaryEmail,
        username: profile.login,
        name: profile.name,
        avatar: profile.avatar_url,
        accessToken: accessToken
      };
      
      await user.save();
      
      res.json({
        message: 'GitHub account connected',
        github: user.github
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async disconnectGoogle(req, res) {
    try {
      const user = await User.findById(req.user._id);
      user.google = undefined;
      await user.save();
      res.json({ message: 'Google account disconnected' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async disconnectFacebook(req, res) {
    try {
      const user = await User.findById(req.user._id);
      user.facebook = undefined;
      await user.save();
      res.json({ message: 'Facebook account disconnected' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async disconnectGitHub(req, res) {
    try {
      const user = await User.findById(req.user._id);
      user.github = undefined;
      await user.save();
      res.json({ message: 'GitHub account disconnected' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Generate JWT token
   */
  generateToken(userId) {
    return jwt.sign(
      { id: userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
    );
  }
}

module.exports = new AuthController();
