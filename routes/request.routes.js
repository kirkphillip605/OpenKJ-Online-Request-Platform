// Filepath: routes/request.routes.js
'use strict';
const express = require('express');
const requestController = require('../controllers/request.controller');

const router = express.Router();

// POST /api/requests/
router.post('/', requestController.submitRequest);

module.exports = router;