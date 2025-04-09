// Filepath: controllers/admin.users.controller.js
const bcrypt = require('bcrypt');
const db = require('../models');
const logger = require('../utils/logger');
const User = db.User;
const saltRounds = 10;

const userController = {
    createUser: async (req, res) => {
        const { username, password, email, is_admin = true } = req.body; // Default new users to admin
        const requestingAdminId = req.auth.userId; // User making the request

        if (!username || !password || !email) {
            return res.status(400).json({ error: true, errorString: 'Username, password, and email are required.' });
        }

        try {
            // Check if username or email already exists
            const existingUser = await User.findOne({ where: { [db.Sequelize.Op.or]: [{ username }, { email }] } });
            if (existingUser) {
                return res.status(409).json({ error: true, errorString: 'Username or email already exists.' });
            }

            const hashedPassword = await bcrypt.hash(password, saltRounds);
            const newUser = await User.create({
                username,
                password_hash: hashedPassword,
                email,
                is_admin // Controlled by input, defaults to true
            });

            // Don't return password hash
            const { password_hash, ...userResponse } = newUser.toJSON();
            logger.info(`[Admin Users] Admin ${requestingAdminId} created new user: ${username} (ID: ${newUser.user_id})`);
            res.status(201).json({ error: false, user: userResponse });

        } catch (error) {
             if (error instanceof db.Sequelize.ValidationError) {
                 logger.warn(`[Admin Users] Validation error creating user by Admin ${requestingAdminId}:`, error.errors);
                 return res.status(400).json({ error: true, errorString: "Validation failed", details: error.errors.map(e => e.message) });
             }
            logger.error(`[Admin Users] Error creating user by Admin ${requestingAdminId}:`, error);
            res.status(500).json({ error: true, errorString: 'Error creating user.' });
        }
    },

    listUsers: async (req, res) => {
         const requestingAdminId = req.auth.userId;
        try {
            const users = await User.findAll({
                attributes: { exclude: ['password_hash'] } // Exclude hash from list
            });
            logger.debug(`[Admin Users] Admin ${requestingAdminId} listed all users.`);
            res.status(200).json({ error: false, users });
        } catch (error) {
            logger.error(`[Admin Users] Error listing users by Admin ${requestingAdminId}:`, error);
            res.status(500).json({ error: true, errorString: 'Error retrieving users.' });
        }
    },

    getUser: async (req, res) => {
        const { userId } = req.params;
        const requestingAdminId = req.auth.userId;
        try {
            const user = await User.findByPk(userId, {
                 attributes: { exclude: ['password_hash'] }
            });
            if (!user) {
                return res.status(404).json({ error: true, errorString: 'User not found.' });
            }
            logger.debug(`[Admin Users] Admin ${requestingAdminId} retrieved user ID: ${userId}.`);
            res.status(200).json({ error: false, user });
        } catch (error) {
            logger.error(`[Admin Users] Error getting user ${userId} by Admin ${requestingAdminId}:`, error);
            res.status(500).json({ error: true, errorString: 'Error retrieving user.' });
        }
    },

    updateUser: async (req, res) => {
        const { userId } = req.params;
        const { email, password, is_admin } = req.body; // Allow updating these fields
        const requestingAdminId = req.auth.userId;

        // Prevent admin from accidentally de-admining themselves? Maybe add check later.

        try {
            const user = await User.findByPk(userId);
            if (!user) {
                return res.status(404).json({ error: true, errorString: 'User not found.' });
            }

            const updateData = {};
            if (email) updateData.email = email;
            if (is_admin !== undefined) updateData.is_admin = !!is_admin; // Ensure boolean
            if (password) {
                updateData.password_hash = await bcrypt.hash(password, saltRounds);
            }

            if (Object.keys(updateData).length === 0) {
                 return res.status(400).json({ error: true, errorString: 'No update fields provided (email, password, is_admin).' });
             }

            await user.update(updateData);

            const { password_hash, ...userResponse } = user.toJSON();
            logger.info(`[Admin Users] Admin ${requestingAdminId} updated user ID: ${userId}.`);
            res.status(200).json({ error: false, user: userResponse });

        } catch (error) {
             if (error instanceof db.Sequelize.ValidationError) {
                 logger.warn(`[Admin Users] Validation error updating user ${userId} by Admin ${requestingAdminId}:`, error.errors);
                 return res.status(400).json({ error: true, errorString: "Validation failed", details: error.errors.map(e => e.message) });
             }
             if (error instanceof db.Sequelize.UniqueConstraintError) {
                logger.warn(`[Admin Users] Unique constraint error updating user ${userId} by Admin ${requestingAdminId}:`, error.fields);
                return res.status(409).json({ error: true, errorString: 'Update failed: Email or username may already be in use.' });
            }
            logger.error(`[Admin Users] Error updating user ${userId} by Admin ${requestingAdminId}:`, error);
            res.status(500).json({ error: true, errorString: 'Error updating user.' });
        }
    },

    deleteUser: async (req, res) => {
        const { userId } = req.params;
        const requestingAdminId = req.auth.userId;

         // Critical: Prevent admin from deleting themselves
         if (parseInt(userId, 10) === requestingAdminId) {
             return res.status(400).json({ error: true, errorString: 'Cannot delete your own account.' });
         }

        try {
            const user = await User.findByPk(userId);
            if (!user) {
                return res.status(404).json({ error: true, errorString: 'User not found.' });
            }

            await user.destroy(); // Associated API keys should cascade delete due to FK constraint
            logger.info(`[Admin Users] Admin ${requestingAdminId} deleted user ID: ${userId} (Username: ${user.username}).`);
            res.status(204).send(); // No content on successful delete

        } catch (error) {
            logger.error(`[Admin Users] Error deleting user ${userId} by Admin ${requestingAdminId}:`, error);
            res.status(500).json({ error: true, errorString: 'Error deleting user.' });
        }
    },
};
module.exports = userController;