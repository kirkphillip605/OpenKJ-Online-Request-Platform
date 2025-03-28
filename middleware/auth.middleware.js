// middleware/auth.middleware.js
// Filepath: middleware/auth.middleware.js
const db = require('../models');
const logger = require('../utils/logger');
const ApiKey = db.ApiKey;
const User = db.User;
const Venue = db.Venue; // Still needed to check if venue_id exists
const State = db.State; // Still needed to check if venue_id exists

const verifyOpenKJApiKey = async (req, res, next) => {
    const apiKey = req.body.api_key;
    const command = req.body.command;
    const venueId = req.body.venue_id;
    // system_id from addSongs treated as venue_id for validation
    const systemIdAsVenueId = (command === 'addSongs') ? req.body.system_id : null;

    if (!apiKey) {
        logger.warn(`[Auth] API key missing for command: ${command}`);
        return res.status(200).json({ command: command, error: true, errorString: 'Authentication failed: API key is required.' });
    }

    try {
        const keyInstance = await ApiKey.findOne({
            where: { key: apiKey },
            include: [{ model: User, as: 'user' }] // Include admin user who generated key (for logging)
        });

        if (!keyInstance) {
            logger.warn(`[Auth] Invalid API key used: ${apiKey.substring(0, 5)}... for command: ${command}`);
            return res.status(200).json({ command: command, error: true, errorString: 'Authentication failed: Invalid API key.' });
        }

        // Attach associated admin user (if exists) to request for logging/auditing
        // It's possible a key exists but the user was deleted, handle this gracefully.
        req.user = keyInstance.user || { user_id: 'N/A (User Deleted?)' };
        const adminUserId = req.user.user_id;

        logger.info(`[Auth] API key validated. Key ID: ${keyInstance.api_key_id}, Associated Admin User ID: ${adminUserId}, Command: ${command}`);

        // --- Venue Existence Check (Crucial) ---
        // Ensure the venue_id specified in the request actually exists in the database.
        // The API key grants access *if* the venue is valid.

        const venueIdToCheck = venueId || systemIdAsVenueId; // Use venue_id or system_id depending on command

        // List of commands that require a valid venue_id or system_id
        const commandsRequiringVenue = ['getRequests', 'deleteRequest', 'setAccepting', 'clearRequests', 'addSongs'];

        if (venueIdToCheck && commandsRequiringVenue.includes(command)) {
            const venueExists = await Venue.findByPk(venueIdToCheck, { attributes: ['venue_id'] }); // Efficiently check existence

            if (!venueExists) {
                logger.warn(`[Auth] Admin User ${adminUserId} / API Key ${keyInstance.api_key_id}: Attempted action on non-existent venue ID ${venueIdToCheck}. Command: ${command}`);
                return res.status(200).json({
                    command: command,
                    error: true,
                    errorString: `Operation failed: Venue ID ${venueIdToCheck} not found.`
                });
            }
            logger.debug(`[Auth] Venue existence confirmed for venue_id: ${venueIdToCheck}. Proceeding with command ${command}.`);

             // If command is addSongs, attach the validated venue_id to req for the controller
             if (command === 'addSongs') {
                 req.venue_id = venueIdToCheck;
             }
        }

        // Optionally update last_used_at (consider performance)
        // keyInstance.last_used_at = new Date();
        // await keyInstance.save();

        next(); // Proceed to the controller

    } catch (error) {
        logger.error('[Auth] Error during API key verification:', error);
        return res.status(500).json({ command: command, error: true, errorString: 'Server error during authentication.' });
    }
};

module.exports = { verifyOpenKJApiKey };