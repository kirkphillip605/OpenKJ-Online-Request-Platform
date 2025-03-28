// middleware/error.middleware.js
const logger = require('../utils/logger');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    logger.error('Unhandled Error:', {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip
    });

    // Avoid sending detailed errors in production
    const statusCode = err.statusCode || 500;
    const message = (process.env.NODE_ENV === 'production' && statusCode === 500)
        ? 'Internal Server Error'
        : err.message || 'An unexpected error occurred';

    res.status(statusCode).json({
        error: true,
        errorString: message,
        // Optionally include command if available on req or err object
        command: req.body?.command || null
    });
};

module.exports = errorHandler;