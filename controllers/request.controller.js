// Filepath: controllers/request.controller.js
'use strict';
const db = require('../models');
const logger = require('../utils/logger');
const Request = db.Request;
const Venue = db.Venue;
const SongDB = db.SongDB; // Needed to potentially verify song exists

// --- Re-use serial update function ---
// NOTE: If controllers get large, move helper to a shared utility file
const updateSerial = async () => {
    try {
        const state = await db.State.findOne();
        if (!state) { await db.ensureStateRow(); const newState = await db.State.findOne(); if(newState){ await newState.increment('serial', { by: 1 }); const u = await db.State.findOne(); return u ? u.serial:1; } return 0; }
        await state.increment('serial', { by: 1 }); const updatedState = await db.State.findOne(); return updatedState ? updatedState.serial : state.serial + 1;
    } catch (error) { logger.error('Failed to update serial:', error); const cs = await db.State.findOne(); return cs ? cs.serial + 1 : 0; }
};

const requestController = {
    submitRequest: async (req, res) => {
        const { venue_id, artist, title, singer_name, key_change = 0 } = req.body;

        if (!venue_id || !artist || !title || !singer_name) {
            return res.status(400).json({ error: true, errorString: 'Venue ID, artist, title, and singer name are required.' });
        }

        try {
            // 1. Verify Venue exists and is accepting requests
            const venue = await Venue.findByPk(venue_id);
            if (!venue) {
                return res.status(404).json({ error: true, errorString: `Venue with ID ${venue_id} not found.` });
            }
            if (!venue.accepting) {
                 logger.warn(`[Requests] Request submitted to non-accepting venue: ${venue_id} by ${singer_name}`);
                return res.status(403).json({ error: true, errorString: `Venue "${venue.name}" is not currently accepting requests.` });
            }

          

            // 3. Create the request
            const newRequest = await Request.create({
                venue_id,
                artist: artist.trim(), // Trim inputs
                title: title.trim(),
                singer: singer_name.trim(),
                key_change: parseInt(key_change, 10) || 0, // Ensure integer
                // request_time defaults to NOW in model/db
            });

            // 4. Increment the global serial because state changed
            await updateSerial(); // Fire and forget (or handle error if critical)

            logger.info(`[Requests] New request submitted by ${singer_name} at venue ${venue_id}. Request ID: ${newRequest.request_id}`);
            res.status(201).json({ error: false, message: 'Request submitted successfully!', request: newRequest });

        } catch (error) {
             if (error instanceof db.Sequelize.ValidationError) {
                 logger.warn(`[Requests] Validation error submitting request:`, error.errors);
                 return res.status(400).json({ error: true, errorString: "Validation failed", details: error.errors.map(e => e.message) });
             }
            logger.error(`[Requests] Error submitting request:`, error);
            res.status(500).json({ error: true, errorString: 'Error submitting request.' });
        }
    }
};

module.exports = requestController;