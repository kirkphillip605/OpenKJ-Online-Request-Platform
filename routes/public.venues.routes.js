// File: routes/public.venues.routes.js

const express = require('express');
const publicVenueController = require('../controllers/public.venues.controller.js');

const router = express.Router();

/**
 * GET /api/public/venues
 *   - Lists venues with optional filters:
 *       id, url_name, or nearby search using lat, lon, and distance.
 */
router.get('/', publicVenueController.listVenues);

module.exports = router;