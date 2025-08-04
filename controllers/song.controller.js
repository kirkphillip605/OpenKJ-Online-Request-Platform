// Filepath: controllers/song.controller.js
'use strict';
const db = require('../models');
const logger = require('../utils/logger');
const SongDB = db.SongDB;
const { Op } = db.Sequelize;

// Helper for pagination
const getPagination = (page, size) => {
    const limit = size ? +size : 20;
    const offset = page ? (page - 1) * limit : 0;
    return { limit, offset };
};

// Basic normalization: lowercases, removes punctuation, and collapses whitespace.
const basicNormalize = (str) => {
    if (!str) return '';
    return str
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};

// Convert tokens in a string that are strictly numeric into their word equivalents.
const convertTokensNumbers = (str) => {
    const writtenNumber = require('written-number');
    return str.split(' ').map(token => {
        if (/^\d+$/.test(token)) {
            return writtenNumber(token);
        }
        return token;
    }).join(' ');
};

// Improved normalization specifically for music search.
const improvedNormalize = (str) => {
    if (!str) return [''];
    let normalized = basicNormalize(str);
    if (normalized.includes(',')) {
        const parts = normalized.split(',').map(s => s.trim());
        if (parts.length === 2) {
            normalized = parts.reverse().join(' ');
        }
    }
    const variantNumeric = normalized;
    const variantTextual = convertTokensNumbers(normalized);
    if (variantNumeric !== variantTextual) {
        return [variantNumeric, variantTextual];
    }
    return [normalized];
};

const songController = {
    searchSongs: async (req, res) => {
        const { q, artist, title, page = 1, size = 20 } = req.query;
        const { limit, offset } = getPagination(page, size);

        try {
            if (q) {
                const normalizedVariants = improvedNormalize(q);
                const tsQueries = normalizedVariants.map(variant => {
                    return variant
                        .split(' ')
                        .map(token => `${token}:*`)
                        .join(' & ');
                });

                const replacements = {
                    tsquery0: tsQueries[0],
                    limit,
                    offset
                };

                let whereClause = `search_vector @@ to_tsquery('english', :tsquery0)`;
                if (tsQueries.length > 1) {
                    replacements.tsquery1 = tsQueries[1];
                    whereClause += ` OR search_vector @@ to_tsquery('english', :tsquery1)`;
                }

                if (artist) {
                    replacements.normArtist = `%${basicNormalize(artist)}%`;
                    whereClause += ` AND lower(artist) LIKE :normArtist`;
                }
                if (title) {
                    replacements.normTitle = `%${basicNormalize(title)}%`;
                    whereClause += ` AND lower(title) LIKE :normTitle`;
                }

                const baseQuery = `
                    SELECT *, ts_rank(search_vector, to_tsquery('english', :tsquery0)) AS rank
                    FROM songdb
                    WHERE ${whereClause}
                    ORDER BY rank DESC
                    LIMIT :limit OFFSET :offset
                `;

                const songs = await SongDB.sequelize.query(baseQuery, {
                    replacements,
                    type: SongDB.sequelize.QueryTypes.SELECT
                });

                const countQuery = `
                    SELECT count(*) as count
                    FROM songdb
                    WHERE ${whereClause}
                `;
                const countResult = await SongDB.sequelize.query(countQuery, {
                    replacements,
                    type: SongDB.sequelize.QueryTypes.SELECT
                });
                const count = parseInt(countResult[0].count, 10);
                const currentPage = page ? +page : 1;
                const totalPages = Math.ceil(count / limit);

                logger.debug(`[Songs] Full-text search performed. Query: ${JSON.stringify(req.query)}, Found: ${count}`);
                return res.status(200).json({
                    error: false,
                    totalItems: count,
                    songs,
                    totalPages,
                    currentPage
                });
            } else {
                const whereClause = {};
                const searchClauses = [];
                if (artist) {
                    searchClauses.push({ artist: { [Op.iLike]: `%${basicNormalize(artist)}%` } });
                }
                if (title) {
                    searchClauses.push({ title: { [Op.iLike]: `%${basicNormalize(title)}%` } });
                }
                if (searchClauses.length > 0) {
                    whereClause[Op.and] = searchClauses;
                }
                const { count, rows } = await SongDB.findAndCountAll({
                    where: whereClause,
                    limit,
                    offset,
                    order: [['artist', 'ASC'], ['title', 'ASC']],
                });
                const currentPage = page ? +page : 1;
                const totalPages = Math.ceil(count / limit);

                logger.debug(`[Songs] Standard search performed. Query: ${JSON.stringify(req.query)}, Found: ${count}`);
                return res.status(200).json({
                    error: false,
                    totalItems: count,
                    songs: rows,
                    totalPages,
                    currentPage
                });
            }
        } catch (error) {
            logger.error(`[Songs] Error searching songs:`, error);
            return res.status(500).json({ error: true, errorString: 'Error searching songs.' });
        }
    },

    getSongById: async (req, res) => {
        const { songId } = req.params;
        try {
            const song = await SongDB.findByPk(songId);
            if (!song) {
                return res.status(404).json({ error: true, errorString: 'Song not found.' });
            }
            logger.debug(`[Songs] Retrieved song ID: ${songId}`);
            return res.status(200).json({ error: false, song });
        } catch (error) {
            logger.error(`[Songs] Error getting song ${songId}:`, error);
            return res.status(500).json({ error: true, errorString: 'Error retrieving song.' });
        }
    },

    listArtists: async (req, res) => {
        const { page = 1, size = 100 } = req.query;
        const { limit, offset } = getPagination(page, size);
        try {
            const { count, rows } = await SongDB.findAndCountAll({
                attributes: ['artist'],
                group: ['artist'],
                order: [['artist', 'ASC']],
                limit,
                offset,
                raw: true
            });
            const totalItems = await SongDB.count({ distinct: true, col: 'artist' });
            const totalPages = Math.ceil(totalItems / limit);
            const currentPage = page ? +page : 1;

            logger.debug(`[Songs] Listed distinct artists. Page: ${currentPage}, Found: ${totalItems}`);
            return res.status(200).json({
                error: false,
                totalItems,
                artists: rows.map(r => r.artist),
                totalPages,
                currentPage
            });
        } catch (error) {
            logger.error(`[Songs] Error listing artists:`, error);
            return res.status(500).json({ error: true, errorString: 'Error retrieving artists.' });
        }
    }
};

module.exports = songController;