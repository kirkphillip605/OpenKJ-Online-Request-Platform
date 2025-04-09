// Filepath: controllers/admin.venues.controller.js
const db = require('../models');
const logger = require('../utils/logger');
const { geocodeAddress } = require('../utils/geocoder'); // Import geocoder
const Venue = db.Venue;

const venueController = {
    createVenue: async (req, res) => {
        const requestingAdminId = req.auth.userId;
        // Extract all potential fields from body
        const { name, url_name, accepting, address1, address2, city, state, zip } = req.body;

        if (!name) {
            return res.status(400).json({ error: true, errorString: 'Venue name is required.' });
        }

        try {
            const venueData = { name, url_name, accepting, address1, address2, city, state, zip };

            // --- Geocode if address parts exist ---
            if (address1 || city || state || zip) {
                const coords = await geocodeAddress({ address1, city, state, zip }); // Assuming US default
                if (coords) {
                    venueData.lat = coords.lat;
                    venueData.lon = coords.lon;
                } else {
                    logger.warn(`[Admin Venues] Geocoding failed or returned no results for new venue "${name}", proceeding without coordinates.`);
                }
            }
            // --- End Geocode ---

            const newVenue = await Venue.create(venueData);
            logger.info(`[Admin Venues] Admin ${requestingAdminId} created new venue: ${name} (ID: ${newVenue.venue_id})`);
            res.status(201).json({ error: false, venue: newVenue });

        } catch (error) {
             if (error instanceof db.Sequelize.ValidationError) {
                 logger.warn(`[Admin Venues] Validation error creating venue by Admin ${requestingAdminId}:`, error.errors);
                 return res.status(400).json({ error: true, errorString: "Validation failed", details: error.errors.map(e => e.message) });
             }
             if (error instanceof db.Sequelize.UniqueConstraintError) {
                logger.warn(`[Admin Venues] Unique constraint error creating venue by Admin ${requestingAdminId}:`, error.fields);
                return res.status(409).json({ error: true, errorString: 'Create failed: URL Name may already be in use.' });
            }
            logger.error(`[Admin Venues] Error creating venue by Admin ${requestingAdminId}:`, error);
            res.status(500).json({ error: true, errorString: 'Error creating venue.' });
        }
    },

    listVenues: async (req, res) => {
        const requestingAdminId = req.auth.userId;
        try {
            const venues = await Venue.findAll({ order: [['name', 'ASC']] });
            logger.debug(`[Admin Venues] Admin ${requestingAdminId} listed all venues.`);
            res.status(200).json({ error: false, venues });
        } catch (error) {
            logger.error(`[Admin Venues] Error listing venues by Admin ${requestingAdminId}:`, error);
            res.status(500).json({ error: true, errorString: 'Error retrieving venues.' });
        }
    },

    getVenue: async (req, res) => {
        const { venueId } = req.params;
        const requestingAdminId = req.auth.userId;
        try {
            const venue = await Venue.findByPk(venueId);
            if (!venue) {
                return res.status(404).json({ error: true, errorString: 'Venue not found.' });
            }
             logger.debug(`[Admin Venues] Admin ${requestingAdminId} retrieved venue ID: ${venueId}.`);
            res.status(200).json({ error: false, venue });
        } catch (error) {
             logger.error(`[Admin Venues] Error getting venue ${venueId} by Admin ${requestingAdminId}:`, error);
            res.status(500).json({ error: true, errorString: 'Error retrieving venue.' });
        }
    },

    updateVenue: async (req, res) => {
        const { venueId } = req.params;
        const requestingAdminId = req.auth.userId;
        const updateFields = req.body; // Get all fields from body

        // Ensure name isn't being blanked out if provided
        if (updateFields.name === '') {
             return res.status(400).json({ error: true, errorString: 'Venue name cannot be empty.' });
         }

        try {
            const venue = await Venue.findByPk(venueId);
            if (!venue) {
                return res.status(404).json({ error: true, errorString: 'Venue not found.' });
            }

            // Check if relevant address fields are being updated
            const addressChanged = ['address1', 'city', 'state', 'zip'].some(field =>
                updateFields[field] !== undefined && updateFields[field] !== venue[field]
            );

             const venueDataForUpdate = { ...updateFields }; // Copy fields to update

            // --- Geocode if address changed ---
             if (addressChanged) {
                const addressToGeocode = {
                    address1: updateFields.address1 ?? venue.address1,
                    city: updateFields.city ?? venue.city,
                    state: updateFields.state ?? venue.state,
                    zip: updateFields.zip ?? venue.zip,
                };
                logger.debug(`[Admin Venues] Address changed for venue ${venueId}, attempting re-geocode.`);
                const coords = await geocodeAddress(addressToGeocode);
                if (coords) {
                     venueDataForUpdate.lat = coords.lat;
                     venueDataForUpdate.lon = coords.lon;
                 } else {
                    logger.warn(`[Admin Venues] Re-geocoding failed for venue ${venueId}, coordinates may be unchanged or nullified if address was removed.`);
                    // Decide if you want to nullify coords if address is removed, or keep old ones. Let's keep old ones for now unless explicitly nulled.
                    if(updateFields.lat === undefined) delete venueDataForUpdate.lat;
                    if(updateFields.lon === undefined) delete venueDataForUpdate.lon;
                 }
             }
            // --- End Geocode ---


            await venue.update(venueDataForUpdate);
            logger.info(`[Admin Venues] Admin ${requestingAdminId} updated venue ID: ${venueId}.`);
            res.status(200).json({ error: false, venue });

        } catch (error) {
             if (error instanceof db.Sequelize.ValidationError) {
                 logger.warn(`[Admin Venues] Validation error updating venue ${venueId} by Admin ${requestingAdminId}:`, error.errors);
                 return res.status(400).json({ error: true, errorString: "Validation failed", details: error.errors.map(e => e.message) });
             }
              if (error instanceof db.Sequelize.UniqueConstraintError) {
                logger.warn(`[Admin Venues] Unique constraint error updating venue ${venueId} by Admin ${requestingAdminId}:`, error.fields);
                return res.status(409).json({ error: true, errorString: 'Update failed: URL Name may already be in use.' });
            }
            logger.error(`[Admin Venues] Error updating venue ${venueId} by Admin ${requestingAdminId}:`, error);
            res.status(500).json({ error: true, errorString: 'Error updating venue.' });
        }
    },

    deleteVenue: async (req, res) => {
        const { venueId } = req.params;
        const requestingAdminId = req.auth.userId;
        try {
            const venue = await Venue.findByPk(venueId);
            if (!venue) {
                return res.status(404).json({ error: true, errorString: 'Venue not found.' });
            }

            await venue.destroy(); // Associated requests/songs should cascade delete
            logger.info(`[Admin Venues] Admin ${requestingAdminId} deleted venue ID: ${venueId} (Name: ${venue.name}).`);
            res.status(204).send();

        } catch (error) {
             logger.error(`[Admin Venues] Error deleting venue ${venueId} by Admin ${requestingAdminId}:`, error);
            res.status(500).json({ error: true, errorString: 'Error deleting venue.' });
        }
    },
};
module.exports = venueController;