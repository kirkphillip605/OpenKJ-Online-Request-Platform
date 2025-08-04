// File: server.js
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

// --- CORS Configuration ---
const allowedOrigins = [
  'https://songbook.kirknetllc.com',
  'http://songbook.kirknetllc.com:5175',
  'https://k03e2io1v3fx9wvj0vr8qd5q58o56n-fkdo.w-credentialless-staticblitz.com'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (e.g., mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Enable if frontend uses cookies or Authorization headers
};

// --- Global Middleware ---
app.use(cors(corsOptions)); // Apply CORS with options
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
app.use(errorHandler); // This should be the last piece of middleware

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