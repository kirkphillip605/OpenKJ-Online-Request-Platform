// middleware/logging.middleware.js
const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
    const start = process.hrtime();

    res.on('finish', () => {
        const durationInMilliseconds = getDurationInMilliseconds(start);
        const logDetails = {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${durationInMilliseconds.toLocaleString()} ms`,
            ip: req.ip,
            userAgent: req.get('user-agent'),
            userId: req.user ? req.user.user_id : 'anonymous', // Log user ID if authenticated
             command: req.body?.command // Log command if present
        };
         // Sanitize sensitive info like api_key before logging body
         if (req.body && typeof req.body === 'object') {
             const sanitizedBody = { ...req.body };
             if (sanitizedBody.api_key) sanitizedBody.api_key = '***';
             // Add other fields to sanitize if necessary (e.g., passwords)
             logDetails.body = sanitizedBody;
         }


        if (res.statusCode >= 400) {
            logger.warn(`HTTP Request: ${req.method} ${req.originalUrl}`, logDetails);
        } else {
            logger.http(`HTTP Request: ${req.method} ${req.originalUrl}`, logDetails);
        }
    });

    next();
};

const getDurationInMilliseconds = (start) => {
    const NS_PER_SEC = 1e9;
    const NS_TO_MS = 1e6;
    const diff = process.hrtime(start);
    return (diff[0] * NS_PER_SEC + diff[1]) / NS_TO_MS;
};

module.exports = requestLogger;