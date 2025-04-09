// Filepath: routes/admin.apikeys.routes.js
const express = require('express');
const apiKeyController = require('../controllers/admin.apikeys.controller');

const router = express.Router();

router.post('/', apiKeyController.createApiKey); // Generate a new key (optionally assign to user)
router.get('/', apiKeyController.listApiKeys); // List all keys (maybe filter by user)
// router.get('/:apiKeyId', apiKeyController.getApiKey); // Maybe less useful to get by ID
router.put('/:apiKeyId', apiKeyController.updateApiKey); // Update description
router.delete('/:apiKeyId', apiKeyController.deleteApiKey); // Revoke/delete key

module.exports = router;