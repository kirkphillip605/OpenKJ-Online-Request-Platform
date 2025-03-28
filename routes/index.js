// routes/index.js
const express = require('express');
const openkjRoutes = require('./openkj.routes');
// const appRoutes = require('./app.routes'); // Placeholder for future frontend API routes

const router = express.Router();

// Mount OpenKJ specific routes
router.use('/openkj', openkjRoutes);

// Mount future frontend API routes
// router.use('/app', appRoutes);

// Simple health check route
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});


module.exports = router;