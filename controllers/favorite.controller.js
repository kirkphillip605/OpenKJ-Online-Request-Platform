// Filepath: controllers/favorite.controller.js
'use strict';
const db = require('../models');
const logger = require('../utils/logger');
const Favorite = db.Favorite;
const Patron = db.Patron;
const SongDB = db.SongDB; // To include song details

const favoriteController = {
    listFavorites: async (req, res) => {
        const patronId = req.auth.patronId; // From verifyPatronToken middleware

        try {
            // Find the patron and include their favorite songs
            const patronWithFavorites = await Patron.findByPk(patronId, {
                // attributes: [], // Exclude patron details if only want songs
                include: [{
                    model: SongDB,
                    as: 'favoriteSongs', // Use the alias defined in Patron model
                    attributes: ['song_id', 'artist', 'title'], // Select desired song fields
                    through: { attributes: ['createdAt'] } // Include when it was favorited
                }],
                order: [ // Order favorites by when they were added
                    [{ model: SongDB, as: 'favoriteSongs' }, db.Favorite, 'createdAt', 'DESC']
                ]
            });

            if (!patronWithFavorites) {
                // Should not happen if token is valid, but handle defensively
                return res.status(404).json({ error: true, errorString: 'Patron not found.' });
            }

            logger.debug(`[Favorites] Patron ${patronId} listed their favorites.`);
            res.status(200).json({ error: false, favorites: patronWithFavorites.favoriteSongs || [] });

        } catch (error) {
            logger.error(`[Favorites] Error listing favorites for Patron ${patronId}:`, error);
            res.status(500).json({ error: true, errorString: 'Error retrieving favorites.' });
        }
    },

    addFavorite: async (req, res) => {
        const patronId = req.auth.patronId;
        const { song_id } = req.body;

        if (!song_id) {
            return res.status(400).json({ error: true, errorString: 'Song ID is required.' });
        }

        try {
            // Verify song exists
            const songExists = await SongDB.findByPk(song_id);
            if (!songExists) {
                return res.status(404).json({ error: true, errorString: `Song with ID ${song_id} not found.` });
            }

            // Use findOrCreate to add favorite and prevent duplicates
            const [favorite, created] = await Favorite.findOrCreate({
                where: { patron_id: patronId, song_id: song_id },
                defaults: { patron_id: patronId, song_id: song_id } // Data if created
            });

            if (created) {
                logger.info(`[Favorites] Patron ${patronId} added song ${song_id} to favorites.`);
                res.status(201).json({ error: false, message: 'Song added to favorites.', favorite });
            } else {
                logger.debug(`[Favorites] Patron ${patronId} tried to add song ${song_id} which was already a favorite.`);
                res.status(200).json({ error: false, message: 'Song is already in favorites.', favorite });
            }

        } catch (error) {
             if (error instanceof db.Sequelize.ForeignKeyConstraintError) {
                 logger.warn(`[Favorites] Foreign key error adding favorite for Patron ${patronId}, Song ${song_id}:`, error);
                 return res.status(400).json({ error: true, errorString: 'Invalid Patron or Song ID provided.' });
             }
            logger.error(`[Favorites] Error adding favorite for Patron ${patronId}:`, error);
            res.status(500).json({ error: true, errorString: 'Error adding favorite.' });
        }
    },

    removeFavorite: async (req, res) => {
        const patronId = req.auth.patronId;
        const { songId } = req.params; // Get songId from URL parameter

         if (!songId) {
            return res.status(400).json({ error: true, errorString: 'Song ID parameter is required.' });
        }

        try {
            const result = await Favorite.destroy({
                where: {
                    patron_id: patronId,
                    song_id: songId
                }
            });

            if (result > 0) {
                logger.info(`[Favorites] Patron ${patronId} removed song ${songId} from favorites.`);
                res.status(204).send(); // No content on successful delete
            } else {
                 logger.warn(`[Favorites] Patron ${patronId} attempted to remove non-existent favorite song ${songId}.`);
                // Return 404 if the favorite didn't exist for this user
                return res.status(404).json({ error: true, errorString: 'Favorite not found for this user and song.' });
            }

        } catch (error) {
            logger.error(`[Favorites] Error removing favorite song ${songId} for Patron ${patronId}:`, error);
            res.status(500).json({ error: true, errorString: 'Error removing favorite.' });
        }
    }
};

module.exports = favoriteController;