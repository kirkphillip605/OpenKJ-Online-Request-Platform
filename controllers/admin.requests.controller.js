// Filepath: controllers/admin.requests.controller.js
const db = require('../models');
const logger = require('../utils/logger');
const Request = db.Request;
const { Op } = db.Sequelize; // Import Op for filtering

const requestController = {
    listRequests: async (req, res) => {
        const requestingAdminId = req.auth.userId;
        const { venue_id } = req.query; // Filter by venue_id query parameter

        const whereClause = {};
        if (venue_id) {
            whereClause.venue_id = venue_id;
        }

        try {
            const requests = await Request.findAll({
                where: whereClause,
                order: [['request_time', 'ASC']],
                include: [{ model: db.Venue, as: 'venue', attributes: ['name']}] // Include venue name
            });
            logger.debug(`[Admin Requests] Admin ${requestingAdminId} listed requests.${venue_id ? ` Filtered by venue_id: ${venue_id}`:''}`);
            res.status(200).json({ error: false, requests });
        } catch (error) {
             logger.error(`[Admin Requests] Error listing requests by Admin ${requestingAdminId}:`, error);
            res.status(500).json({ error: true, errorString: 'Error retrieving requests.' });
        }
    },

    deleteRequest: async (req, res) => {
        const { requestId } = req.params;
        const requestingAdminId = req.auth.userId;
        try {
            const request = await Request.findByPk(requestId);
            if (!request) {
                return res.status(404).json({ error: true, errorString: 'Request not found.' });
            }
            await request.destroy();
            logger.info(`[Admin Requests] Admin ${requestingAdminId} deleted request ID: ${requestId}.`);
            res.status(204).send();
        } catch (error) {
            logger.error(`[Admin Requests] Error deleting request ${requestId} by Admin ${requestingAdminId}:`, error);
            res.status(500).json({ error: true, errorString: 'Error deleting request.' });
        }
    },

    purgeVenueRequests: async (req, res) => {
        const { venueId } = req.params;
        const requestingAdminId = req.auth.userId;
         try {
            // Verify venue exists before purging
             const venueExists = await db.Venue.findByPk(venueId, { attributes: ['venue_id'] });
             if (!venueExists) {
                return res.status(404).json({ error: true, errorString: `Venue with ID ${venueId} not found.` });
             }

             const { count } = await Request.destroy({
                 where: { venue_id: venueId },
             });
             logger.info(`[Admin Requests] Admin ${requestingAdminId} purged ${count} requests for venue ID: ${venueId}.`);
             res.status(200).json({ error: false, message: `Successfully purged ${count} requests for venue ID ${venueId}.` }); // 204 no content might also be suitable
         } catch (error) {
             logger.error(`[Admin Requests] Error purging requests for venue ${venueId} by Admin ${requestingAdminId}:`, error);
             res.status(500).json({ error: true, errorString: `Error purging requests for venue ID ${venueId}.` });
         }
     }
};
module.exports = requestController;