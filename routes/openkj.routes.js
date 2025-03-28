// routes/openkj.routes.js
const express = require('express');
const openKJController = require('../controllers/openkj.controller');
const { verifyOpenKJApiKey } = require('../middleware/auth.middleware');

const router = express.Router();

// Apply API key authentication middleware to the OpenKJ command route
router.post('/', verifyOpenKJApiKey, openKJController.handleOpenKJCommand);

module.exports = router;