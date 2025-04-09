// Filepath: routes/admin.venues.routes.js
const express = require('express');
const venueController = require('../controllers/admin.venues.controller.js');

const router = express.Router();

router.post('/', venueController.createVenue); // Create new venue (with geocoding)
router.get('/', venueController.listVenues); // List all venues
router.get('/:venueId', venueController.getVenue); // Get specific venue
router.put('/:venueId', venueController.updateVenue); // Update venue (with geocoding)
router.delete('/:venueId', venueController.deleteVenue); // Delete venue

module.exports = router;