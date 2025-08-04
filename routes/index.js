// File: routes/index.js
'use strict';
const express = require('express');
const openkjRoutes = require('./openkj.routes');
const authRoutes = require('./auth.routes');
const adminUserRoutes = require('./admin.users.routes');
const adminVenueRoutes = require('./admin.venues.routes');
const adminRequestRoutes = require('./admin.requests.routes');
const adminApiKeyRoutes = require('./admin.apikeys.routes');
const patronAuthRoutes = require('./patron.auth.routes');
const songRoutes = require('./song.routes');
const requestRoutes = require('./request.routes');
const favoriteRoutes = require('./favorite.routes');
const { verifyAdminToken } = require('../middleware/auth.middleware');

// Import public venues routes
const publicVenuesRoutes = require('./public.venues.routes.js');

const router = express.Router();

// --- Public or Specific Auth Routes ---
router.use('/auth', authRoutes);
router.use('/patron/auth', patronAuthRoutes);
router.use('/songs', songRoutes);
router.use('/requests', requestRoutes);

// --- OpenKJ Specific Routes (API Key Auth) ---
router.use('/openkj', openkjRoutes);

// --- Patron Specific Routes (Patron JWT Auth) ---
const patronRouter = express.Router();
patronRouter.use('/favorites', favoriteRoutes);
router.use('/patron', patronRouter);

// --- Admin Routes (Admin JWT Auth) ---
const adminRouter = express.Router();
adminRouter.use(verifyAdminToken);
adminRouter.use('/users', adminUserRoutes);
adminRouter.use('/venues', adminVenueRoutes);
adminRouter.use('/requests', adminRequestRoutes);
adminRouter.use('/apikeys', adminApiKeyRoutes);
router.use('/admin', adminRouter);

// --- Public Venues Route (No authentication required) ---
router.use('/public/venues', publicVenuesRoutes);

// --- Health check route ---
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

module.exports = router;