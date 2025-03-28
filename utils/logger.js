// utils/logger.js
const winston = require('winston');
require('dotenv').config();

const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }), // Log stack traces
    winston.format.splat(),
    winston.format.json() // Log in JSON format
);

const transports = [
    new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple() // Simple format for console
        )
    })
];

// Add file transport if LOG_FILE is specified and not in test environment
if (process.env.LOG_FILE && process.env.NODE_ENV !== 'test') {
    transports.push(
        new winston.transports.File({
            filename: process.env.LOG_FILE,
            format: logFormat // Use JSON format for file logs
        })
    );
}

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat, // Default format
    transports: transports
});

logger.info(`Logger initialized with level: ${logger.level}`);

module.exports = logger;