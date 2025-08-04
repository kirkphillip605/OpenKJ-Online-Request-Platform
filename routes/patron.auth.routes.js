// Filepath: routes/patron.auth.routes.js
'use strict';
const express = require('express');
const patronAuthController = require('../controllers/patron.auth.controller');

const router = express.Router();

// POST /api/patron/auth/register
router.post('/register', patronAuthController.register);

// POST /api/patron/auth/login
router.post('/login', patronAuthController.login);

module.exports = router;