// Filepath: utils/geocoder.js
const axios = require('axios');
const logger = require('./logger');

const GEOCODE_API_URL = 'https://geocode.maps.co/search';
const API_KEY = process.env.GEOCODING_API_KEY;

/**
 * Geocodes an address using geocode.maps.co API.
 * @param {object} address - Address components.
 * @param {string} [address.address1] - Street address line 1.
 * @param {string} [address.city] - City.
 * @param {string} [address.state] - State (e.g., 'NY').
 * @param {string} [address.zip] - Zip code.
 * @param {string} [address.country='US'] - Country code (defaults to US).
 * @returns {Promise<{lat: number, lon: number} | null>} - Latitude and Longitude or null if not found/error.
 */
const geocodeAddress = async (address) => {
    if (!API_KEY) {
        logger.error('Geocoding API Key (GEOCODING_API_KEY) is not configured in environment variables.');
        return null;
    }

    const { address1, city, state, zip, country = 'US' } = address;

    // Construct query string - filter out null/empty parts
    const queryParts = [address1, city, state, zip, country].filter(part => part && String(part).trim());
    if (queryParts.length < 2) { // Need at least something more than just country
        logger.warn('[Geocoder] Insufficient address parts provided for geocoding.', address);
        return null;
    }
    const queryString = queryParts.join(', '); // Simple comma separation

    try {
        logger.debug(`[Geocoder] Geocoding address: "${queryString}"`);
        const response = await axios.get(GEOCODE_API_URL, {
            params: {
                q: queryString,
                api_key: API_KEY
            },
            timeout: 5000 // 5 second timeout
        });

        // Check if response has data and is an array
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
            // Select the first result (often the most relevant)
            const result = response.data[0];
            if (result.lat && result.lon) {
                const lat = parseFloat(result.lat);
                const lon = parseFloat(result.lon);
                if (!isNaN(lat) && !isNaN(lon)) {
                    logger.info(`[Geocoder] Geocoding successful for "${queryString}": Lat ${lat}, Lon ${lon}`);
                    return { lat, lon };
                }
            }
        }

        logger.warn(`[Geocoder] No valid coordinates found for address: "${queryString}"`, response.data);
        return null;

    } catch (error) {
        if (axios.isAxiosError(error)) {
            logger.error(`[Geocoder] Axios error geocoding "${queryString}": ${error.message}`, { status: error.response?.status, data: error.response?.data });
        } else {
            logger.error(`[Geocoder] Unexpected error geocoding "${queryString}":`, error);
        }
        return null;
    }
};

module.exports = { geocodeAddress };