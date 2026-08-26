const express = require('express');
const router = express.Router();
const facebookAccountController = require('../controllers/facebookAccountController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Facebook Accounts
 *   description: Multi-Facebook account management endpoints
 */

// All routes require authentication
router.use(authMiddleware.protect);

// Get all Facebook accounts for the current user
router.get('/', facebookAccountController.getAllAccounts);

// Connect a new Facebook account
router.post('/connect', facebookAccountController.connectAccount);

// Get a specific Facebook account
router.get('/:accountId', facebookAccountController.getAccount);

// Disconnect a Facebook account
router.delete('/:accountId', facebookAccountController.disconnectAccount);

// Get all pages for a Facebook account
router.get('/:accountId/pages', facebookAccountController.getAccountPages);

// Get all groups for a Facebook account
router.get('/:accountId/groups', facebookAccountController.getAccountGroups);

// Connect a specific page to a Facebook account
router.post('/:accountId/pages/:pageId', facebookAccountController.connectPage);

// Disconnect a page from a Facebook account
router.delete('/:accountId/pages/:pageId', facebookAccountController.disconnectPage);

// Connect a specific group to a Facebook account
router.post('/:accountId/groups/:groupId', facebookAccountController.connectGroup);

// Disconnect a group from a Facebook account
router.delete('/:accountId/groups/:groupId', facebookAccountController.disconnectGroup);

// Sync pages and groups for a Facebook account
router.post('/:accountId/sync', facebookAccountController.syncAccount);

// Update settings for a Facebook account
router.put('/:accountId/settings', facebookAccountController.updateAccountSettings);

// Get default account, page, and group
router.get('/default', facebookAccountController.getDefaults);

// Set a page as default
router.post('/:accountId/pages/:pageId/set-default', facebookAccountController.setDefaultPage);

// Set a group as default
router.post('/:accountId/groups/:groupId/set-default', facebookAccountController.setDefaultGroup);

// Refresh access token for a Facebook account
router.post('/:accountId/refresh-token', facebookAccountController.refreshToken);

module.exports = router;
