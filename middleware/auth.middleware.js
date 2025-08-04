// Filepath: middleware/auth.middleware.js
const db = require('../models');
const logger = require('../utils/logger');
const jwt = require('jsonwebtoken'); // Import jwt
const ApiKey = db.ApiKey;
const User = db.User;
const Venue = db.Venue;
const Patron = db.Patron;

// --- Existing verifyOpenKJApiKey function ---
const verifyOpenKJApiKey = async (req, res, next) => {
    // ... (keep existing implementation) ...
    const apiKey = req.body.api_key;
    const command = req.body.command;
    const venueId = req.body.venue_id;

    if (!apiKey) {
        logger.warn(`[Auth] API key missing for command: ${command}`);
        return res.status(200).json({ command: command, error: true, errorString: 'Authentication failed: API key is required.' });
    }
    try {
        const keyInstance = await ApiKey.findOne({ where: { key: apiKey } });
        if (!keyInstance) {
            logger.warn(`[Auth] Invalid API key used: ${apiKey.substring(0, 5)}... for command: ${command}`);
            return res.status(200).json({ command: command, error: true, errorString: 'Authentication failed: Invalid API key.' });
        }
        req.apiKeyId = keyInstance.api_key_id;
        // Get user associated with the key for logging in controller
        const userGeneratingKey = await User.findByPk(keyInstance.user_id);
        req.user = userGeneratingKey || { user_id: 'N/A (User Deleted?)' }; // Attach user info to req

        logger.info(`[Auth] API key validated. Key ID: ${req.apiKeyId}, Associated Admin User ID: ${req.user.user_id}, Command: ${command}`);
        const venueIdToCheck = venueId;
        const commandsRequiringVenue = ['getRequests', 'deleteRequest', 'setAccepting', 'clearRequests'];
        if (venueIdToCheck && commandsRequiringVenue.includes(command)) {
            const venueExists = await Venue.findByPk(venueIdToCheck, { attributes: ['venue_id'] });
            if (!venueExists) {
                logger.warn(`[Auth] API Key ${req.apiKeyId}: Attempted action on non-existent venue ID ${venueIdToCheck}. Command: ${command}`);
                return res.status(200).json({
                    command: command,
                    error: true,
                    errorString: `Operation failed: Venue ID ${venueIdToCheck} not found.`
                });
            }
            logger.debug(`[Auth] API Key ${req.apiKeyId}: Venue existence confirmed for venue_id: ${venueIdToCheck}. Proceeding with command ${command}.`);
        }
        next();
    } catch (error) {
        logger.error('[Auth] Error during API key verification:', error);
        return res.status(500).json({ command: command, error: true, errorString: 'Server error during authentication.' });
    }
};

// --- NEW function to verify Admin JWT ---
const verifyAdminToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
        return res.status(401).json({ error: true, errorString: 'Authentication required: No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach decoded payload (contains userId, username, isAdmin) to request
        req.auth = decoded; // Use req.auth to avoid conflict with req.user in OpenKJ route

        // Explicitly check if the user associated with the token is still valid and is an admin
        const user = await User.findByPk(decoded.userId);
        if (!user) {
            logger.warn(`[Admin Auth] User ID ${decoded.userId} from valid token not found in DB.`);
            return res.status(401).json({ error: true, errorString: 'Invalid token: User not found.' });
        }
        if (!user.is_admin) {
             logger.warn(`[Admin Auth] User ${user.username} (ID: ${user.user_id}) attempted admin action but is not admin.`);
            return res.status(403).json({ error: true, errorString: 'Forbidden: Admin privileges required.' });
        }

         // Add user object to req.auth for convenience in controllers
         req.auth.user = user;

        logger.debug(`[Admin Auth] Token validated for admin user: ${req.auth.username} (ID: ${req.auth.userId})`);
        next(); // Proceed if token is valid and user is admin

    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            logger.warn('[Admin Auth] Token expired.');
            return res.status(401).json({ error: true, errorString: 'Authentication failed: Token expired.' });
        }
        if (error instanceof jwt.JsonWebTokenError) {
            logger.warn('[Admin Auth] Invalid token:', error.message);
            return res.status(401).json({ error: true, errorString: `Authentication failed: ${error.message}` });
        }
        logger.error('[Admin Auth] Error during token verification:', error);
        return res.status(500).json({ error: true, errorString: 'Server error during authentication.' });
    }
};


const verifyPatronToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
        return res.status(401).json({ error: true, errorString: 'Authentication required: No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if payload contains patronId (distinguishes from admin tokens if needed)
        if (!decoded.patronId) {
             logger.warn(`[Patron Auth] Token verification failed: Missing patronId in payload.`);
            return res.status(401).json({ error: true, errorString: 'Authentication failed: Invalid token type.' });
        }

        // Attach decoded payload to request
        req.auth = decoded; // Use req.auth for consistency

        // Optional: Verify patron exists in DB based on token patronId
        const patron = await Patron.findByPk(decoded.patronId);
         if (!patron) {
             logger.warn(`[Patron Auth] Patron ID ${decoded.patronId} from valid token not found in DB.`);
             return res.status(401).json({ error: true, errorString: 'Invalid token: Patron not found.' });
         }
         req.auth.patron = patron; // Attach patron object if needed in controllers

        logger.debug(`[Patron Auth] Token validated for patron: ${req.auth.email} (ID: ${req.auth.patronId})`);
        next(); // Proceed if token is valid

    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            logger.warn('[Patron Auth] Token expired.');
            return res.status(401).json({ error: true, errorString: 'Authentication failed: Token expired.' });
        }
        if (error instanceof jwt.JsonWebTokenError) {
            logger.warn('[Patron Auth] Invalid token:', error.message);
            return res.status(401).json({ error: true, errorString: `Authentication failed: ${error.message}` });
        }
        logger.error('[Patron Auth] Error during token verification:', error);
        return res.status(500).json({ error: true, errorString: 'Server error during authentication.' });
    }
};


module.exports = { verifyOpenKJApiKey, verifyAdminToken, verifyPatronToken };