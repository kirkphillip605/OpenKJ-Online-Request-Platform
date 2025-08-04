// Filepath: controllers/auth.controller.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../models');
const logger = require('../utils/logger');
const User = db.User;

const authController = {
    /**
     * Handles admin user login.
     * Expects { username, password } in request body.
     * Returns JWT on success.
     */
    login: async (req, res) => {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: true, errorString: 'Username and password are required.' });
        }

        try {
            const user = await User.findOne({ where: { username: username } });

            if (!user) {
                logger.warn(`Login attempt failed for username: ${username} (User not found)`);
                return res.status(401).json({ error: true, errorString: 'Invalid credentials.' });
            }

            // Compare provided password with the stored hash
            const isMatch = await bcrypt.compare(password, user.password_hash);

            if (!isMatch) {
                logger.warn(`Login attempt failed for username: ${username} (Password mismatch)`);
                return res.status(401).json({ error: true, errorString: 'Invalid credentials.' });
            }

            // Ensure the user is an admin (redundant if only admins can log in here, but good practice)
            if (!user.is_admin) {
                 logger.warn(`Login attempt successful but user is not admin: ${username}`);
                 return res.status(403).json({ error: true, errorString: 'Access denied. Admin privileges required.' });
             }

            // Generate JWT payload
            const payload = {
                userId: user.user_id,
                username: user.username,
                isAdmin: user.is_admin,
            };

            // Sign the token
            const token = jwt.sign(
                payload,
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '90d' } // Use expiry from env or default
            );

            logger.info(`Admin user logged in successfully: ${username} (ID: ${user.user_id})`);

            // Send token back to client
            res.status(200).json({
                error: false,
                message: 'Login successful.',
                token: token,
                user: { // Send back some non-sensitive user info
                    userId: user.user_id,
                    username: user.username,
                    email: user.email,
                    isAdmin: user.is_admin
                }
            });

        } catch (error) {
            logger.error('Error during admin login:', error);
            res.status(500).json({ error: true, errorString: 'Internal server error during login.' });
        }
    }
    // Add logout/token refresh later if needed
};

module.exports = authController;