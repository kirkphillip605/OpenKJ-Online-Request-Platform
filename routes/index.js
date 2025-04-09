// Filepath: routes/index.js
const express = require('express');
const openkjRoutes = require('./openkj.routes');
const authRoutes = require('./auth.routes'); // Import auth routes
const adminUserRoutes = require('./admin.users.routes');
const adminVenueRoutes = require('./admin.venues.routes');
const adminRequestRoutes = require('./admin.requests.routes');
const adminApiKeyRoutes = require('./admin.apikeys.routes');
const { verifyAdminToken } = require('../middleware/auth.middleware'); // Import admin verification

const router = express.Router();

// --- Public or Specific Auth Routes ---
router.use('/auth', authRoutes); // Mount login route (e.g., /api/auth/login)

// --- OpenKJ Specific Routes (API Key Auth) ---
router.use('/openkj', openkjRoutes); // Already exists, uses verifyOpenKJApiKey internally

// --- Admin Routes (JWT Auth + Admin Check) ---
const adminRouter = express.Router(); // Create a sub-router for admin routes
adminRouter.use(verifyAdminToken); // Apply admin auth middleware to ALL routes below this point

adminRouter.use('/users', adminUserRoutes);     // Mount /api/admin/users
adminRouter.use('/venues', adminVenueRoutes);   // Mount /api/admin/venues
adminRouter.use('/requests', adminRequestRoutes); // Mount /api/admin/requests
adminRouter.use('/apikeys', adminApiKeyRoutes); // Mount /api/admin/apikeys

// Mount the admin sub-router under /admin
router.use('/admin', adminRouter);


// --- Simple health check route ---
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});


module.exports = router;