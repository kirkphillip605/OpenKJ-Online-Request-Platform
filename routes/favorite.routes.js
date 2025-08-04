// Filepath: routes/favorite.routes.js
'use strict';
const express = require('express');
const favoriteController = require('../controllers/favorite.controller');
const { verifyPatronToken } = require('../middleware/auth.middleware'); // Use Patron auth

const router = express.Router();

// Apply patron authentication middleware to all favorite routes
router.use(verifyPatronToken);

// GET /api/patron/favorites/
router.get('/', favoriteController.listFavorites);

// POST /api/patron/favorites/
router.post('/', favoriteController.addFavorite);

// DELETE /api/patron/favorites/:songId
router.delete('/:songId', favoriteController.removeFavorite);

module.exports = router;