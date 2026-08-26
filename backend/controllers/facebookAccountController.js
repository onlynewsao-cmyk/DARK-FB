/**
 * Facebook Account Controller
 * Handles multi-Facebook account management for users
 */

const User = require('../models/User');
const FacebookService = require('../services/facebookService');
const { getRandomUserAgent } = require('../config/rateLimiter');

class FacebookAccountController {
  constructor() {
    this.facebookService = new FacebookService();
  }

  /**
   * @swagger
   * /api/facebook-accounts:
   *   get:
   *     summary: Get all Facebook accounts for the current user
   *     tags: [Facebook Accounts]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of Facebook accounts
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 accounts:
   *                   type: array
   *                   items:
   *                     type: object
   *                 totalPages:
   *                   type: number
   *                 totalGroups:
   *                   type: number
   */
  async getAllAccounts(req, res) {
    try {
      const user = await User.findById(req.user._id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({
        accounts: user.facebookAccounts,
        totalPages: user.stats.totalPages || 0,
        totalGroups: user.stats.totalGroups || 0
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/facebook-accounts/connect:
   *   post:
   *     summary: Connect a new Facebook account
   *     tags: [Facebook Accounts]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - accessToken
   *             properties:
   *               accessToken:
   *                 type: string
   *                 description: Facebook access token
   *     responses:
   *       201:
   *         description: Facebook account connected
   */
  async connectAccount(req, res) {
    try {
      const { accessToken } = req.body;
      
      if (!accessToken) {
        return res.status(400).json({ error: 'Access token is required' });
      }
      
      const user = await User.findById(req.user._id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Verify token
      const service = new FacebookService(accessToken);
      const debugInfo = await service.debugToken(accessToken);
      
      if (!debugInfo.data || !debugInfo.data.is_valid) {
        return res.status(400).json({ error: 'Invalid access token' });
      }
      
      // Get user info
      const userInfo = await service.getUserProfile('me', ['id', 'name', 'email']);
      
      // Get user pages
      const pages = await service.getUserPages();
      
      // Get user groups
      const groups = await service.getUserGroups();
      
      // Prepare account data
      const accountData = {
        accountId: userInfo.id,
        accountName: userInfo.name,
        accountType: 'personal',
        accessToken,
        tokenExpires: new Date(Date.now() + (debugInfo.data.expires_in || 3600) * 1000),
        tokenType: debugInfo.data.expires_in ? 'short_lived' : 'never_expiring',
        pages: pages.data ? pages.data.map(page => ({
          pageId: page.id,
          pageName: page.name,
          pageAccessToken: page.access_token,
          pagePicture: page.picture?.data?.url,
          fanCount: page.fan_count,
          category: page.category,
          permissions: page.permissions || [],
          isConnected: true,
          connectedAt: new Date()
        })) : [],
        groups: groups.data ? groups.data.map(group => ({
          groupId: group.id,
          groupName: group.name,
          groupPicture: group.picture?.data?.url,
          privacy: group.privacy,
          memberCount: group.member_count,
          isAdmin: false, // Will be determined later
          isConnected: true,
          connectedAt: new Date()
        })) : [],
        isConnected: true,
        connectedAt: new Date()
      };
      
      // Add account to user
      await user.addFacebookAccount(accountData);
      
      res.status(201).json({
        message: 'Facebook account connected successfully',
        account: accountData
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/facebook-accounts/{accountId}:
   *   get:
   *     summary: Get a specific Facebook account
   *     tags: [Facebook Accounts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: accountId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Facebook account data
   */
  async getAccount(req, res) {
    try {
      const { accountId } = req.params;
      
      const user = await User.findById(req.user._id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const account = user.facebookAccounts.find(acc => acc.accountId === accountId);
      
      if (!account) {
        return res.status(404).json({ error: 'Facebook account not found' });
      }
      
      res.json(account);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/facebook-accounts/{accountId}:
   *   delete:
   *     summary: Disconnect a Facebook account
   *     tags: [Facebook Accounts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: accountId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Facebook account disconnected
   */
  async disconnectAccount(req, res) {
    try {
      const { accountId } = req.params;
      
      const user = await User.findById(req.user._id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      await user.removeFacebookAccount(accountId);
      
      res.json({ message: 'Facebook account disconnected successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/facebook-accounts/{accountId}/pages:
   *   get:
   *     summary: Get all pages for a Facebook account
   *     tags: [Facebook Accounts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: accountId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: List of pages
   */
  async getAccountPages(req, res) {
    try {
      const { accountId } = req.params;
      
      const user = await User.findById(req.user._id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const account = user.facebookAccounts.find(acc => acc.accountId === accountId);
      
      if (!account) {
        return res.status(404).json({ error: 'Facebook account not found' });
      }
      
      res.json({
        pages: account.pages || [],
        accountId: account.accountId,
        accountName: account.accountName
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/facebook-accounts/{accountId}/groups:
   *   get:
   *     summary: Get all groups for a Facebook account
   *     tags: [Facebook Accounts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: accountId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: List of groups
   */
  async getAccountGroups(req, res) {
    try {
      const { accountId } = req.params;
      
      const user = await User.findById(req.user._id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const account = user.facebookAccounts.find(acc => acc.accountId === accountId);
      
      if (!account) {
        return res.status(404).json({ error: 'Facebook account not found' });
      }
      
      res.json({
        groups: account.groups || [],
        accountId: account.accountId,
        accountName: account.accountName
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/facebook-accounts/{accountId}/pages/{pageId}:
   *   post:
   *     summary: Connect a specific page to a Facebook account
   *     tags: [Facebook Accounts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: accountId
   *         required: true
   *         schema:
   *           type: string
   *       - in: path
   *         name: pageId
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - pageName
   *               - pageAccessToken
   *             properties:
   *               pageName:
   *                 type: string
   *               pageAccessToken:
   *                 type: string
   *               pagePicture:
   *                 type: string
   *               fanCount:
   *                 type: number
   *     responses:
   *       201:
   *         description: Page connected to account
   */
  async connectPage(req, res) {
    try {
      const { accountId, pageId } = req.params;
      const { pageName, pageAccessToken, pagePicture, fanCount, category } = req.body;
      
      const user = await User.findById(req.user._id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const pageData = {
        pageId,
        pageName,
        pageAccessToken,
        pagePicture,
        fanCount,
        category,
        permissions: [],
        isConnected: true
      };
      
      await user.addPageToAccount(accountId, pageData);
      
      res.status(201).json({
        message: 'Page connected successfully',
        page: pageData
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/facebook-accounts/{accountId}/pages/{pageId}:
   *   delete:
   *     summary: Disconnect a page from a Facebook account
   *     tags: [Facebook Accounts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: accountId
   *         required: true
   *         schema:
   *           type: string
   *       - in: path
   *         name: pageId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Page disconnected from account
   */
  async disconnectPage(req, res) {
    try {
      const { accountId, pageId } = req.params;
      
      const user = await User.findById(req.user._id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      await user.removePageFromAccount(accountId, pageId);
      
      res.json({ message: 'Page disconnected successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/facebook-accounts/{accountId}/groups/{groupId}:
   *   post:
   *     summary: Connect a specific group to a Facebook account
   *     tags: [Facebook Accounts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: accountId
   *         required: true
   *         schema:
   *           type: string
   *       - in: path
   *         name: groupId
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - groupName
   *             properties:
   *               groupName:
   *                 type: string
   *               groupPicture:
   *                 type: string
   *               privacy:
   *                 type: string
   *               memberCount:
   *                 type: number
   *               isAdmin:
   *                 type: boolean
   *     responses:
   *       201:
   *         description: Group connected to account
   */
  async connectGroup(req, res) {
    try {
      const { accountId, groupId } = req.params;
      const { groupName, groupPicture, privacy, memberCount, isAdmin } = req.body;
      
      const user = await User.findById(req.user._id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const groupData = {
        groupId,
        groupName,
        groupPicture,
        privacy,
        memberCount,
        isAdmin: isAdmin || false,
        isConnected: true
      };
      
      await user.addGroupToAccount(accountId, groupData);
      
      res.status(201).json({
        message: 'Group connected successfully',
        group: groupData
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/facebook-accounts/{accountId}/groups/{groupId}:
   *   delete:
   *     summary: Disconnect a group from a Facebook account
   *     tags: [Facebook Accounts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: accountId
   *         required: true
   *         schema:
   *           type: string
   *       - in: path
   *         name: groupId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Group disconnected from account
   */
  async disconnectGroup(req, res) {
    try {
      const { accountId, groupId } = req.params;
      
      const user = await User.findById(req.user._id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      await user.removeGroupFromAccount(accountId, groupId);
      
      res.json({ message: 'Group disconnected successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/facebook-accounts/{accountId}/sync:
   *   post:
   *     summary: Sync pages and groups for a Facebook account
   *     tags: [Facebook Accounts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: accountId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Sync completed
   */
  async syncAccount(req, res) {
    try {
      const { accountId } = req.params;
      
      const user = await User.findById(req.user._id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const account = user.facebookAccounts.find(acc => acc.accountId === accountId);
      
      if (!account) {
        return res.status(404).json({ error: 'Facebook account not found' });
      }
      
      // Sync pages
      const service = new FacebookService(account.accessToken);
      const pages = await service.getUserPages();
      
      for (const page of pages.data || []) {
        await user.addPageToAccount(accountId, {
          pageId: page.id,
          pageName: page.name,
          pageAccessToken: page.access_token,
          pagePicture: page.picture?.data?.url,
          fanCount: page.fan_count,
          category: page.category,
          permissions: page.permissions || []
        });
      }
      
      // Sync groups
      const groups = await service.getUserGroups();
      
      for (const group of groups.data || []) {
        await user.addGroupToAccount(accountId, {
          groupId: group.id,
          groupName: group.name,
          groupPicture: group.picture?.data?.url,
          privacy: group.privacy,
          memberCount: group.member_count
        });
      }
      
      // Update last sync
      account.lastSyncAt = new Date();
      await user.save();
      
      res.json({
        message: 'Account synced successfully',
        pages: pages.data || [],
        groups: groups.data || []
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/facebook-accounts/{accountId}/settings:
   *   put:
   *     summary: Update settings for a Facebook account
   *     tags: [Facebook Accounts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: accountId
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               settings:
   *                 type: object
   *                 properties:
   *                   defaultPage:
   *                     type: string
   *                   defaultGroup:
   *                     type: string
   *                   autoPost:
   *                     type: boolean
   *                   autoReply:
   *                     type: boolean
   *                   maxPostsPerDay:
   *                     type: number
   *     responses:
   *       200:
   *         description: Settings updated
   */
  async updateAccountSettings(req, res) {
    try {
      const { accountId } = req.params;
      const { settings } = req.body;
      
      const user = await User.findById(req.user._id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const account = user.facebookAccounts.find(acc => acc.accountId === accountId);
      
      if (!account) {
        return res.status(404).json({ error: 'Facebook account not found' });
      }
      
      // Update account settings
      account.settings = { ...account.settings, ...settings };
      await user.save();
      
      res.json({
        message: 'Account settings updated successfully',
        settings: account.settings
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/facebook-accounts/default:
   *   get:
   *     summary: Get default Facebook account, page, and group
   *     tags: [Facebook Accounts]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Default account, page, and group
   */
  async getDefaults(req, res) {
    try {
      const user = await User.findById(req.user._id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Get default account
      const defaultAccount = user.facebookAccounts.find(
        acc => acc.accountId === user.settings?.defaultPage?.split(':')[0]
      ) || user.facebookAccounts[0];
      
      // Get default page
      let defaultPage = null;
      if (user.settings?.defaultPage) {
        const [accountId, pageId] = user.settings.defaultPage.split(':');
        const account = user.facebookAccounts.find(acc => acc.accountId === accountId);
        if (account) {
          defaultPage = account.pages.find(p => p.pageId === pageId);
        }
      }
      
      // Get default group
      let defaultGroup = null;
      if (user.settings?.defaultGroup) {
        const [accountId, groupId] = user.settings.defaultGroup.split(':');
        const account = user.facebookAccounts.find(acc => acc.accountId === accountId);
        if (account) {
          defaultGroup = account.groups.find(g => g.groupId === groupId);
        }
      }
      
      res.json({
        defaultAccount,
        defaultPage,
        defaultGroup,
        allAccounts: user.facebookAccounts,
        allPages: user.getAllPages(),
        allGroups: user.getAllGroups()
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/facebook-accounts/{accountId}/pages/{pageId}/set-default:
   *   post:
   *     summary: Set a page as default
   *     tags: [Facebook Accounts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: accountId
   *         required: true
   *         schema:
   *           type: string
   *       - in: path
   *         name: pageId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Default page set
   */
  async setDefaultPage(req, res) {
    try {
      const { accountId, pageId } = req.params;
      
      const user = await User.findById(req.user._id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Verify page exists
      const account = user.facebookAccounts.find(acc => acc.accountId === accountId);
      if (!account) {
        return res.status(404).json({ error: 'Facebook account not found' });
      }
      
      const page = account.pages.find(p => p.pageId === pageId);
      if (!page) {
        return res.status(404).json({ error: 'Page not found' });
      }
      
      await user.setDefaultPage(`${accountId}:${pageId}`);
      
      res.json({
        message: 'Default page set successfully',
        defaultPage: `${accountId}:${pageId}`
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/facebook-accounts/{accountId}/groups/{groupId}/set-default:
   *   post:
   *     summary: Set a group as default
   *     tags: [Facebook Accounts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: accountId
   *         required: true
   *         schema:
   *           type: string
   *       - in: path
   *         name: groupId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Default group set
   */
  async setDefaultGroup(req, res) {
    try {
      const { accountId, groupId } = req.params;
      
      const user = await User.findById(req.user._id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const account = user.facebookAccounts.find(acc => acc.accountId === accountId);
      if (!account) {
        return res.status(404).json({ error: 'Facebook account not found' });
      }
      
      const group = account.groups.find(g => g.groupId === groupId);
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }
      
      await user.setDefaultGroup(`${accountId}:${groupId}`);
      
      res.json({
        message: 'Default group set successfully',
        defaultGroup: `${accountId}:${groupId}`
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @swagger
   * /api/facebook-accounts/{accountId}/refresh-token:
   *   post:
   *     summary: Refresh access token for a Facebook account
   *     tags: [Facebook Accounts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: accountId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Token refreshed
   */
  async refreshToken(req, res) {
    try {
      const { accountId } = req.params;
      
      const user = await User.findById(req.user._id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const account = user.facebookAccounts.find(acc => acc.accountId === accountId);
      
      if (!account) {
        return res.status(404).json({ error: 'Facebook account not found' });
      }
      
      // Check if we have a refresh token
      if (!account.refreshToken) {
        return res.status(400).json({
          error: 'No refresh token available. Please reconnect the account.'
        });
      }
      
      // Exchange short-lived token for long-lived token
      const service = new FacebookService(account.accessToken);
      const debugInfo = await service.debugToken(account.accessToken);
      
      // If token is still valid and long-lived, just return it
      if (debugInfo.data.expires_in > 86400 * 50) {
        return res.json({
          message: 'Token is still valid',
          accessToken: account.accessToken,
          expiresIn: debugInfo.data.expires_in
        });
      }
      
      // Try to refresh using the refresh token
      // Note: Facebook's token refresh requires the original short-lived token
      // For long-lived tokens, we need to go through the OAuth flow again
      
      res.status(400).json({
        error: 'Token refresh requires OAuth flow. Please reconnect the account.',
        instructions: 'Use the connect flow to get a new token'
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new FacebookAccountController();
