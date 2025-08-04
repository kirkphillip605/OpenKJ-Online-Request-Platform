// Filepath: controllers/openkj.controller.js
const db = require('../models');
const logger = require('../utils/logger');
const { Sequelize } = require('sequelize');

// --- Database Models ---
const State = db.State;
const Venue = db.Venue;
const Request = db.Request;
const SongDB = db.SongDB;

// --- Helper function to update serial ---
// Ensures atomicity using transactions if needed, though simple increment is often sufficient here.
const updateSerial = async () => {
    try {
        // Find the single state row. Use findOne as there's no primary key to use findByPk.
        const state = await State.findOne();
        if (!state) {
            logger.error("State row not found. Cannot update serial.");
            // Attempt to create if missing - relies on ensureStateRow at startup, but good fallback
            await db.ensureStateRow();
            const newState = await State.findOne();
            if (newState) {
                 // Increment the newly created state row
                 await newState.increment('serial', { by: 1 });
                 // Fetch again after increment to get the updated value reliably
                 const updatedStateAgain = await State.findOne();
                 return updatedStateAgain ? updatedStateAgain.serial : 1; // Return new serial (1 after first increment from 0)
            }
            logger.error("Failed to create state row even after ensuring.");
            return 0; // Fallback if creation fails
        }
         // Use Sequelize's increment for atomic update on the existing row
         await state.increment('serial', { by: 1 });
         // Fetch the updated state to get the new serial value reliably
         const updatedState = await State.findOne();
         return updatedState ? updatedState.serial : state.serial + 1; // Return new serial

    } catch (error) {
        logger.error('Failed to update serial:', error);
        // Decide how to handle this - maybe return the old serial or a specific error indicator?
        // For OpenKJ, it expects a serial, so returning an estimated one might be best.
        const currentState = await State.findOne(); // Try fetching again
        return currentState ? currentState.serial + 1 : 0; // Best guess fallback
    }
};


// --- Controller Object ---
const openKJController = {
    /**
     * Main handler to route commands based on the 'command' field in the request body.
     */
    handleOpenKJCommand: async (req, res, next) => {
        const { command } = req.body;
        // Get admin user ID associated with the API key for logging
        const adminUserId = req.user?.user_id || 'N/A';

        if (!command) {
            logger.warn(`[OpenKJ Handler] Admin ${adminUserId}: Received request with missing command.`);
            // Note: OpenKJ expects 200 OK even for bad requests, with error flags.
            return res.status(200).json({ command: command, error: true, errorString: 'A valid command is required.' });
        }

        logger.info(`[OpenKJ Handler] Admin ${adminUserId}: Processing command '${command}'`);

        try {
             // --- Venue ID Pre-Check (Basic validation for commands needing it) ---
             // Auth middleware validates existence, this is just a quick check for presence
             const venueId = req.body.venue_id;
             const commandsRequiringVenueId = ['getRequests', 'deleteRequest', 'setAccepting', 'clearRequests'];
             if (commandsRequiringVenueId.includes(command) && (venueId === undefined || venueId === null || venueId === '')) {
                 logger.warn(`[OpenKJ Handler] Admin ${adminUserId}: Command '${command}' requires a valid 'venue_id'. Received: ${venueId}`);
                 return res.status(200).json({ command: command, error: true, errorString: 'Venue ID is required for this command.' });
             }
             // AddSongs requires 'system_id', but controller uses req.body.songs directly for global db
             // clearDatabase uses 'system_id' for logging maybe, but operates globally


            switch (command) {
                case 'getSerial':
                    return openKJController.getSerial(req, res);
                case 'getRequests': // Needs venue_id (validated by middleware)
                    return openKJController.getRequests(req, res);
                case 'deleteRequest': // Needs venue_id, request_id (venue_id validated by middleware)
                    return openKJController.deleteRequest(req, res);
                case 'setAccepting': // Needs venue_id, accepting (venue_id validated by middleware)
                    return openKJController.setAccepting(req, res);
                case 'getVenues': // Returns all venues
                    return openKJController.getVenues(req, res);
                case 'clearRequests': // Needs venue_id (validated by middleware)
                    return openKJController.clearRequests(req, res);
                case 'addSongs': // Operates on global song db
                    return openKJController.addSongs(req, res);
                case 'clearDatabase': // Added based on C++ code - operates on global song db
                    return openKJController.clearDatabase(req, res); // !! ENSURE THIS IS SECURED APPROPRIATELY !!
                case 'getAlert':
                    return openKJController.getAlert(req, res);
                case 'getEntitledSystemCount': // Counts all venues
                    return openKJController.getEntitledSystemCount(req, res);
                case 'connectionTest':
                    return openKJController.connectionTest(req, res);
                default:
                    logger.warn(`[OpenKJ Handler] Admin ${adminUserId}: Received unrecognized command: ${command}`);
                    return res.status(200).json({ command: command, error: true, errorString: 'Unrecognized Command.' });
            }
        } catch (error) {
            // Catch unexpected errors within command handlers if they don't handle themselves
            logger.error(`[OpenKJ Handler] Admin ${adminUserId}: Uncaught error processing command '${command}':`, error);
            // Pass to the generic error handler middleware
            next(error); // Let the error middleware handle the response format
        }
    },

    // --- Individual Command Handlers ---

    getSerial: async (req, res) => {
        const command = 'getSerial';
        const adminUserId = req.user?.user_id || 'N/A';
        try {
            const state = await State.findOne();
             if (!state) {
                 await db.ensureStateRow(); // Ensure it exists on first call if missed at startup
                 const newState = await State.findOne();
                 logger.warn(`[${command}] Admin ${adminUserId}: State row was missing, created default. Serial: ${newState?.serial ?? 0}`);
                 return res.status(200).json({ command, serial: newState?.serial ?? 0, error: false });
             }
            logger.info(`[${command}] Admin ${adminUserId}: Retrieved serial: ${state.serial}`);
            return res.status(200).json({ command, serial: state.serial, error: false });
        } catch (error) {
            logger.error(`[${command}] Admin ${adminUserId}: Error retrieving serial:`, error);
            // OpenKJ expects 200 OK with error flags
            return res.status(200).json({ command, error: true, errorString: 'Error retrieving serial.' });
        }
    },

    getRequests: async (req, res) => {
        const command = 'getRequests';
        const { venue_id } = req.body; // Existence validated by middleware
        const adminUserId = req.user.user_id;

        // Redundant check (already done in handleOpenKJCommand), but safe
        if (!venue_id) {
            return res.status(200).json({ command, error: true, errorString: 'Venue ID is required.' });
        }

        try {
        // Fetch requests for the specific venue
        const requests = await Request.findAll({
            where: { venue_id },
            attributes: [
                'request_id',
                'artist',
                'title',
                'singer',
                'request_time',
                'key_change'
            ],
            order: [['request_time', 'ASC']],
            raw: true
        });

            // Fetch the current global serial
        const state = await State.findOne();
        const serial = state ? state.serial : 0;

            // Convert request_time to Unix timestamp
        const formattedRequests = requests.map(request => {
            const unixTime = request.request_time instanceof Date
                ? Math.floor(request.request_time.getTime() / 1000)
                : null;

            return {
                ...request,
                request_time: unixTime
            };
        }).filter(req => req.request_time !== null);

            logger.info(`[${command}] Admin ${adminUserId}: Retrieved ${formattedRequests.length} requests for venue ${venue_id}. Serial: ${serial}`);
            return res.status(200).json({
                command,
                requests: formattedRequests,
                error: false,
                serial: serial
            });
        } catch (error) {
            logger.error(`[${command}] Admin ${adminUserId}: Error retrieving requests for venue ${venue_id}:`, error);
            return res.status(200).json({ command, error: true, errorString: 'Error retrieving requests.' });
        }
    },

    deleteRequest: async (req, res) => {
        const command = 'deleteRequest';
        const { venue_id, request_id } = req.body;
        const adminUserId = req.user.user_id;

        // Basic validation for request_id presence
        if (request_id === undefined || request_id === null || request_id === '') {
             logger.warn(`[${command}] Admin ${adminUserId}: Request ID missing for venue ${venue_id}.`);
             return res.status(200).json({ command, error: true, errorString: 'Request ID is required.' });
        }
        // venue_id presence checked in handler

        try {
            // Find the specific request within the specified venue
            const requestToDelete = await Request.findOne({
                where: {
                    request_id,
                    venue_id // Ensures request belongs to the correct venue
                }
            });

            if (!requestToDelete) {
                logger.warn(`[${command}] Admin ${adminUserId}: Request ID ${request_id} not found for venue ${venue_id}.`);
                // Keep error generic for client, but log specifics
                return res.status(200).json({ command, error: true, errorString: 'Request not found.' });
            }

            await requestToDelete.destroy();
            logger.info(`[${command}] Admin ${adminUserId}: Deleted request ID ${request_id} for venue ${venue_id}.`);

            // Increment serial *after* successful deletion
            const newSerial = await updateSerial();

            return res.status(200).json({ command, error: false, serial: newSerial });

        } catch (error) {
            logger.error(`[${command}] Admin ${adminUserId}: Error deleting request ID ${request_id} for venue ${venue_id}:`, error);
            return res.status(200).json({ command, error: true, errorString: 'Error deleting request.' });
        }
    },

    setAccepting: async (req, res) => {
        const command = 'setAccepting';
        // system_id is ignored as per C++ code reference, using venue_id
        let { venue_id, accepting } = req.body; // Venue existence validated by middleware
        const adminUserId = req.user.user_id;

        // venue_id presence checked in handler

         // Coerce accepting status robustly (true/false, '1'/'0', 'true'/'false')
         let newAcceptingStatus;
         if (accepting === '1' || accepting === true || String(accepting).toLowerCase() === 'true') {
             newAcceptingStatus = true;
         } else if (accepting === '0' || accepting === false || String(accepting).toLowerCase() === 'false') {
             newAcceptingStatus = false;
         } else {
             logger.warn(`[${command}] Admin ${adminUserId}: Invalid or missing 'accepting' status for venue ${venue_id}. Received: ${accepting}`);
             return res.status(200).json({ command, error: true, errorString: 'A boolean accepting status (true/false or 1/0) is required.' });
         }

        try {
            // Find the venue using primary key (efficient)
            const venue = await Venue.findByPk(venue_id);
             if (!venue) {
                 // This should ideally never happen if auth middleware works correctly
                 logger.error(`[${command}] Admin ${adminUserId}: Venue ${venue_id} not found after auth check!`);
                 return res.status(200).json({ command, error: true, errorString: 'Venue not found.' });
             }

            await venue.update({ accepting: newAcceptingStatus });
            logger.info(`[${command}] Admin ${adminUserId}: Set accepting status for venue ${venue_id} to ${newAcceptingStatus}.`);

            // Increment serial *after* successful update
            const newSerial = await updateSerial();

            return res.status(200).json({
                command,
                error: false,
                venue_id: venue.venue_id, // Use the actual venue_id from the object
                accepting: newAcceptingStatus,
                serial: newSerial
            });
        } catch (error) {
            logger.error(`[${command}] Admin ${adminUserId}: Error setting accepting status for venue ${venue_id}:`, error);
            return res.status(200).json({ command, error: true, errorString: 'Error setting accepting status.' });
        }
    },

    getVenues: async (req, res) => {
        const command = 'getVenues';
        const adminUserId = req.user.user_id;

        try {
            // Fetch ALL venues, as OpenKJ needs the list to choose from
            const venues = await Venue.findAll({
                attributes: [
                    'venue_id', // Primary Key
                    'name',
                    'url_name',
                    'accepting'
                ],
                order: [['name', 'ASC']] // Order alphabetically
            });

            logger.info(`[${command}] Admin ${adminUserId}: Retrieved ${venues.length} total venues for OpenKJ selection.`);
            return res.status(200).json({ command, venues: venues, error: false });
        } catch (error) {
            logger.error(`[${command}] Admin ${adminUserId}: Error retrieving all venues:`, error);
            return res.status(200).json({ command, error: true, errorString: 'Error retrieving venues.' });
        }
    },

    clearRequests: async (req, res) => {
        const command = 'clearRequests';
        const { venue_id } = req.body; // Venue existence validated by middleware
        const adminUserId = req.user.user_id;

        // venue_id presence checked in handler

        try {
            // Destroy requests belonging to the specific venue
            const { count } = await Request.destroy({
                where: { venue_id },
            }); // Returns number of deleted rows

            logger.info(`[${command}] Admin ${adminUserId}: Cleared ${count} requests for venue ${venue_id}.`);

            // Increment serial *after* successful clear
            const newSerial = await updateSerial();

            return res.status(200).json({ command, error: false, serial: newSerial });
        } catch (error) {
            logger.error(`[${command}] Admin ${adminUserId}: Error clearing requests for venue ${venue_id}:`, error);
            return res.status(200).json({ command, error: true, errorString: 'Error clearing requests.' });
        }
    },

    addSongs: async (req, res) => {
        const command = 'addSongs';
        // Songs are global, no venue_id filter needed for insertion.
        const { songs, system_id } = req.body; // system_id is received but not used for insertion logic
        const adminUserId = req.user.user_id; // Admin user associated with the API key

        logger.debug(`[${command}] Received system_id: ${system_id || 'N/A'} (not used for song insertion filter)`);

        if (!songs || !Array.isArray(songs)) {
             logger.warn(`[${command}] Admin ${adminUserId}: 'songs' array missing/invalid.`);
             const currentState = await State.findOne(); // Get current serial for error response
             return res.status(200).json({
                 command, error: true, errorString: 'Songs array is required.',
                 errors: [], "entries processed": 0, "last_artist": null, "last_title": null, serial: currentState?.serial ?? 0
             });
         }

        let processedCount = 0;
        const errors = [];
        let lastArtist = null;
        let lastTitle = null;
        const songsToAdd = [];

        logger.info(`[${command}] Admin ${adminUserId}: Processing ${songs.length} songs for GLOBAL songbook.`);

        for (const song of songs) {
             const { artist, title } = song;
             if (!artist || !title || typeof artist !== 'string' || typeof title !== 'string') {
                 errors.push(`Invalid song entry (missing/invalid artist or title): ${JSON.stringify(song)}`);
                 continue;
             }
             const trimmedArtist = artist.trim();
             const trimmedTitle = title.trim();
             if (!trimmedArtist || !trimmedTitle) {
                 errors.push(`Invalid song entry (empty artist or title after trim): ${JSON.stringify(song)}`);
                 continue;
             }
             const combined = `${trimmedArtist} - ${trimmedTitle}`;
            songsToAdd.push({
                // No venue_id
                artist: trimmedArtist,
                title: trimmedTitle,
                combined: combined
            });
            lastArtist = trimmedArtist; // Keep track of the last valid input processed
            lastTitle = trimmedTitle;
        }

        let currentSerial = (await State.findOne())?.serial ?? 0;
        let serialUpdated = false; // Track if serial was actually updated

        if (songsToAdd.length > 0) {
            try {
                // Use bulkCreate with ignoreDuplicates for the global table
                // Duplicates based on the 'combined' unique index will be ignored.
                await SongDB.bulkCreate(songsToAdd, {
                    ignoreDuplicates: true,
                });
                processedCount = songsToAdd.length; // Report attempts based on valid inputs
                logger.info(`[${command}] Admin ${adminUserId}: bulkCreate attempted for ${songsToAdd.length} songs in global songbook.`);

                 // Update serial *only* if there were valid song entries attempted.
                 // OpenKJ behavior suggests serial increments on state changes. Adding songs IS a state change.
                 // We update even if all songs were duplicates, as an operation was performed.
                 if (errors.length < songs.length) {
                     currentSerial = await updateSerial();
                     serialUpdated = true;
                 }

            } catch (dbError) {
                 // Handle potential errors (though ignoreDuplicates reduces UniqueConstraintError chances)
                logger.error(`[${command}] Admin ${adminUserId}: Database error adding global songs:`, dbError);
                errors.push(`Database error during bulk add: ${dbError.message}`);
                 // Do not update serial on generic DB errors
            }
        } else {
            logger.warn(`[${command}] Admin ${adminUserId}: No valid songs to add to global songbook after processing inputs.`);
        }

        const hasErrors = errors.length > 0;
        const response = {
            command,
            error: hasErrors,
            errorString: hasErrors ? `Errors occurred during song addition. Check 'errors' array.` : null,
            errors: errors,
            "entries processed": processedCount, // How many were *attempted* after validation
            "last_artist": lastArtist,
            "last_title": lastTitle,
            serial: currentSerial // Return the potentially updated serial
        };

         if (hasErrors) {
             logger.warn(`[${command}] Admin ${adminUserId}: Completed global addSongs with ${errors.length} input/db errors. Processed attempts: ${processedCount}. Serial updated: ${serialUpdated}`);
         } else {
              logger.info(`[${command}] Admin ${adminUserId}: Successfully processed global addSongs for ${processedCount} potential songs. Serial updated: ${serialUpdated}`);
         }

        return res.status(200).json(response);
    },

    clearDatabase: async (req, res) => {
        const command = 'clearDatabase';
        const { system_id } = req.body; // Received from OpenKJ, primarily for logging context
        const adminUserId = req.user.user_id;

        logger.warn(`[${command}] Admin ${adminUserId}: Initiating GLOBAL SongDB clear. Triggered by system_id: ${system_id || 'N/A'}.`);

        try {
            // Truncate the entire songdb table for efficiency
            const deletedCount = await SongDB.destroy({
                where: {}, // Empty condition targets all rows
                truncate: true, // Usually faster than DELETE FROM for full table clear
                cascade: false // Not typically needed for SongDB if it has no dependents
            });

            logger.info(`[${command}] Admin ${adminUserId}: Successfully truncated global songdb table. Result: ${deletedCount}.`);

            // Update serial since the song database state changed significantly
            const newSerial = await updateSerial();

            return res.status(200).json({ command, error: false, serial: newSerial });
        } catch (error) {
            logger.error(`[${command}] Admin ${adminUserId}: Error clearing global songdb:`, error);
            return res.status(200).json({ command, error: true, errorString: 'Error clearing song database.' });
        }
    },

    getAlert: async (req, res) => {
        const command = 'getAlert';
        const adminUserId = req.user?.user_id || 'N/A';
        // Placeholder - Implement actual alert retrieval logic.
        // This could come from a global setting, db table, etc.
        try {
            // Example: Fetch from a configuration or maybe a dedicated 'Alerts' table
            const alertActive = false; // Replace with actual logic
            const alertTitle = ""; // Replace with actual logic
            const alertMessage = ""; // Replace with actual logic

            const alertData = alertActive
                ? { alert: true, title: alertTitle, message: alertMessage }
                : { alert: false, title: "", message: "" };

            logger.debug(`[${command}] Admin ${adminUserId}: Retrieved alert status. Active: ${alertActive}`);
            return res.status(200).json({ command, error: false, ...alertData });
        } catch (error) {
             logger.error(`[${command}] Admin ${adminUserId}: Error retrieving alert:`, error);
             // Return default non-alert state on error to avoid blocking client.
             return res.status(200).json({ command, error: false, alert: false, title: "", message: "" });
        }
    },

    getEntitledSystemCount: async (req, res) => {
        const command = 'getEntitledSystemCount';
        const adminUserId = req.user.user_id; // User must be authenticated via API key

        try {
            // Count *all* venues in the system, as this represents potential systems using the service
            const count = await Venue.count();

            logger.info(`[${command}] Admin ${adminUserId}: Total system venue count reported as entitled count: ${count}`);
            // The C++ code defaults to 1, but counting venues seems more logical for "entitlement"
            return res.status(200).json({ command, error: false, count: count > 0 ? count : 1 }); // Ensure at least 1 if venues exist? Or just count? Let's return actual count or 1 if 0.
        } catch (error) {
            logger.error(`[${command}] Admin ${adminUserId}: Error retrieving total venue count:`, error);
            return res.status(200).json({ command, error: true, errorString: 'Error retrieving entitled system count.' });
        }
    },

    connectionTest: async (req, res) => {
        const command = 'connectionTest';
        const adminUserId = req.user?.user_id || 'Authenticated'; // Should be authenticated to reach here
        logger.info(`[${command}] Admin ${adminUserId}: Connection test successful.`);
        // OpenKJ C++ code checks for command=getSerial response, but this endpoint exists too.
        // Let's return the expected format based on the C++ test() function logic (error=false implicit)
        // Or simpler, just return 'ok' as per original reference. Let's stick to 'ok'.
        return res.status(200).json({ command, connection: 'ok' });
    },
};

module.exports = openKJController;