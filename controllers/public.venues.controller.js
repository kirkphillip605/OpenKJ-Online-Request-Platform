// File: controllers/public.venues.controller.js

const db = require('../models');
const { literal, where: sequelizeWhere } = require('sequelize');
const logger = require('../utils/logger');
const Venue = db.Venue;

/**
 * Public Venue Controller
 *
 * GET /api/public/venues
 *   - Retrieves venues without requiring authentication.
 *   - Supported query parameters:
 *       ?id=<venue_id> - Filter by exact venue id.
 *       ?url_name=<string> - Filter by exact url_name.
 *       ?lat=<latitude>&lon=<longitude>&distance=<km> - Returns venues within distance (km) from the specified coordinates.
 *   - Returns venue data excluding createdAt and updatedAt fields.
 */
const publicVenueController = {
  listVenues: async (req, res) => {
    try {
      // Base query options: exclude timestamps and order by name.
      const queryOptions = {
        where: {},
        attributes: { exclude: ['createdAt', 'updatedAt'] },
        order: [['name', 'ASC']]
      };

      // --- Filter by venue ID ---
      if (req.query.id) {
        queryOptions.where.venue_id = req.query.id;
      }

      // --- Filter by URL name ---
      if (req.query.url_name) {
        queryOptions.where.url_name = req.query.url_name;
      }

      // --- Filter by geographic proximity (nearby venues) ---
      const lat = parseFloat(req.query.lat);
      const lon = parseFloat(req.query.lon);
      const distance = parseFloat(req.query.distance);

      if (!isNaN(lat) && !isNaN(lon) && !isNaN(distance)) {
        // Haversine formula to calculate distance (Earth radius approximated to 6371 km)
        const distanceFormula = literal(
          `(6371 * acos( cos( radians(${lat}) ) * cos( radians(Venue.lat) ) * cos( radians(Venue.lon) - radians(${lon}) ) + sin( radians(${lat}) ) * sin( radians(Venue.lat) ) ))`
        );
        // Include distance as an extra attribute.
        queryOptions.attributes.include = [[distanceFormula, 'distance']];
        // Filter results to only include venues within the specified distance.
        queryOptions.having = sequelizeWhere(distanceFormula, '<=', distance);
        // Order by distance when proximity filtering is applied.
        queryOptions.order = [literal('distance ASC')];
      }

      // Query the database with the built options.
      const venues = await Venue.findAll(queryOptions);
      logger.debug('Public venue listing succeeded.', { query: req.query });
      return res.status(200).json({ error: false, venues });
    } catch (error) {
      logger.error('Error retrieving public venues.', {
        message: error.message,
        stack: error.stack,
        query: req.query,
      });
      return res.status(500).json({ error: true, errorString: 'Error retrieving venues.' });
    }
  }
};

module.exports = publicVenueController;