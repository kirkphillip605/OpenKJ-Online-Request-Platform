// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./models'); // Import models and connection logic
const logger = require('./utils/logger');
const apiRoutes = require('./routes');
const errorHandler = require('./middleware/error.middleware');
const requestLogger = require('./middleware/logging.middleware');


const app = express();
const PORT = process.env.PORT || 3000;

// --- Global Middleware ---
app.use(cors()); // Enable CORS - configure origins properly for production
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(requestLogger); // Log incoming requests

// --- API Routes ---
app.use('/api', apiRoutes); // Mount all API routes under /api

// --- Default Route for testing ---
app.get('/', (req, res) => {
    res.send('Karaoke API is running!');
});

// --- Global Error Handler ---
// This should be the last piece of middleware
app.use(errorHandler);

// --- Start Server ---
const startServer = async () => {
    try {
        logger.info('Attempting to connect to the database...');
        await db.connectDB(); // Establish database connection
         await db.ensureStateRow(); // Ensure the single state row exists on startup
        logger.info('Database connection successful.');

        app.listen(PORT, () => {
            logger.info(`Server is running on port ${PORT}`);
            logger.info(`Environment: ${process.env.NODE_ENV}`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1); // Exit if server fails to start
    }
};

startServer();