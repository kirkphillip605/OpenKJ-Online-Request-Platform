// Filepath: routes/admin.requests.routes.js
const express = require('express');
const requestController = require('../controllers/admin.requests.controller');

const router = express.Router();

// Note: Routes might be nested under venues, e.g., /api/admin/venues/:venueId/requests
// Or flat like this, requiring venue_id in query/body. Let's use query params for listing.
router.get('/', requestController.listRequests); // List requests (filter by venue_id query)
router.delete('/:requestId', requestController.deleteRequest); // Delete specific request
router.delete('/purge/:venueId', requestController.purgeVenueRequests); // Purge all for venue

module.exports = router;