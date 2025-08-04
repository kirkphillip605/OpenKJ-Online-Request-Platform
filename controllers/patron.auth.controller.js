// Filepath: controllers/patron.auth.controller.js
'use strict';
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../models');
const logger = require('../utils/logger');
const Patron = db.Patron; // Use Patron model
const saltRounds = 10;

const patronAuthController = {
    register: async (req, res) => {
        const { first_name, last_name, email, mobile_number, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: true, errorString: 'Email and password are required for registration.' });
        }
        // Basic email format check (more robust validation is better)
        if (!/\S+@\S+\.\S+/.test(email)) {
            return res.status(400).json({ error: true, errorString: 'Invalid email format.' });
        }

        try {
            const existingPatron = await Patron.findOne({ where: { email: email } });
            if (existingPatron) {
                return res.status(409).json({ error: true, errorString: 'Email already registered.' });
            }

            const hashedPassword = await bcrypt.hash(password, saltRounds);
            const newPatron = await Patron.create({
                first_name,
                last_name,
                email,
                mobile_number,
                password_hash: hashedPassword,
            });

            // Don't return password hash
            const { password_hash, ...patronResponse } = newPatron.toJSON();
            logger.info(`[Patron Auth] New patron registered: ${email} (ID: ${newPatron.patron_id})`);
            res.status(201).json({ error: false, patron: patronResponse });

        } catch (error) {
             if (error instanceof db.Sequelize.ValidationError) {
                 logger.warn(`[Patron Auth] Validation error registering patron:`, error.errors);
                 return res.status(400).json({ error: true, errorString: "Validation failed", details: error.errors.map(e => e.message) });
             }
            logger.error(`[Patron Auth] Error registering patron:`, error);
            res.status(500).json({ error: true, errorString: 'Error during registration.' });
        }
    },

    login: async (req, res) => {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: true, errorString: 'Email and password are required.' });
        }

        try {
            const patron = await Patron.findOne({ where: { email: email } });

            // Ensure patron exists AND has a password (meaning they are registered)
            if (!patron || !patron.password_hash) {
                logger.warn(`[Patron Auth] Login attempt failed for email: ${email} (Patron not found or not registered)`);
                return res.status(401).json({ error: true, errorString: 'Invalid credentials or user not registered.' });
            }

            const isMatch = await bcrypt.compare(password, patron.password_hash);

            if (!isMatch) {
                logger.warn(`[Patron Auth] Login attempt failed for email: ${email} (Password mismatch)`);
                return res.status(401).json({ error: true, errorString: 'Invalid credentials.' });
            }

            // Generate JWT payload for Patron
            const payload = {
                patronId: patron.patron_id, // Use specific patron id
                email: patron.email,
                // Add other non-sensitive info if needed (e.g., name)
                // DO NOT include isAdmin flag here for patrons
            };

            const token = jwt.sign(
                payload,
                process.env.JWT_SECRET, // Can use the same secret or a separate one
                { expiresIn: process.env.JWT_EXPIRES_IN || '90d' }
            );

            logger.info(`[Patron Auth] Patron logged in successfully: ${email} (ID: ${patron.patron_id})`);

            res.status(200).json({
                error: false,
                message: 'Login successful.',
                token: token,
                patron: { // Send back some patron info
                    patronId: patron.patron_id,
                    first_name: patron.first_name,
                    last_name: patron.last_name,
                    email: patron.email
                }
            });

        } catch (error) {
            logger.error(`[Patron Auth] Error during patron login:`, error);
            res.status(500).json({ error: true, errorString: 'Internal server error during login.' });
        }
    }
};

module.exports = patronAuthController;