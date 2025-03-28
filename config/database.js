// Filepath: config/database.js
require('dotenv').config();
const logger = require('../utils/logger');

// Determine the environment, defaulting to 'development' if not set
const env = process.env.NODE_ENV || 'development';

logger.info(`Running in environment: ${env}`);

// Define base configuration shared across environments
const baseConfig = {
  dialect: process.env.DB_DIALECT || 'postgres',
  logging: (msg) => logger.debug(msg),
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    underscored: false,
  }
};

// Define configurations for each environment
const config = {
  development: {
    ...baseConfig,
    username: process.env.DEV_DB_USER || process.env.DB_USER,
    password: process.env.DEV_DB_PASSWORD || process.env.DB_PASSWORD,
    database: process.env.DEV_DB_NAME || process.env.DB_NAME,
    host: process.env.DEV_DB_HOST || process.env.DB_HOST,
    port: process.env.DEV_DB_PORT || process.env.DB_PORT,
    dialect: process.env.DEV_DB_DIALECT || baseConfig.dialect,
  },
  test: {
    ...baseConfig,
    username: process.env.TEST_DB_USER || process.env.DB_USER,
    password: process.env.TEST_DB_PASSWORD || process.env.DB_PASSWORD,
    database: process.env.TEST_DB_NAME || process.env.DB_NAME,
    host: process.env.TEST_DB_HOST || process.env.DB_HOST,
    port: process.env.TEST_DB_PORT || process.env.DB_PORT,
    dialect: process.env.TEST_DB_DIALECT || baseConfig.dialect,
    logging: false,
  },
  production: {
    ...baseConfig,
    username: process.env.PROD_DB_USER || process.env.DB_USER,
    password: process.env.PROD_DB_PASSWORD || process.env.DB_PASSWORD,
    database: process.env.PROD_DB_NAME || process.env.DB_NAME,
    host: process.env.PROD_DB_HOST || process.env.DB_HOST,
    port: process.env.PROD_DB_PORT || process.env.DB_PORT,
    dialect: process.env.PROD_DB_DIALECT || baseConfig.dialect,
    logging: (msg) => logger.info(msg),
    pool: {
        max: process.env.PROD_DB_POOL_MAX || 10,
        min: process.env.PROD_DB_POOL_MIN || 2,
        acquire: process.env.PROD_DB_POOL_ACQUIRE || 60000,
        idle: process.env.PROD_DB_POOL_IDLE || 30000
    },
  }
};

// Select the configuration for the current environment
const currentConfig = config[env];

// --- Add Validation and Export Logic ---
if (!currentConfig) {
  logger.error(`Invalid NODE_ENV specified: '${env}'. Configuration not found in config/database.js.`);
  process.exit(1); // Exit if environment config is missing
}

// Add a stricter check for essential production variables
if (env === 'production') {
    const requiredProdVars = ['PROD_DB_USER', 'PROD_DB_PASSWORD', 'PROD_DB_NAME', 'PROD_DB_HOST'];
    const missingVars = requiredProdVars.filter(v => !process.env[v]);
    if (missingVars.length > 0) {
        logger.error(`Missing required production environment variables: ${missingVars.join(', ')}`);
        logger.error('These must be set in the production environment.');
        process.exit(1); // Exit if essential prod vars aren't set
    }
    // Optionally check derived values in currentConfig as well
    if (!currentConfig.username || !currentConfig.password || !currentConfig.database || !currentConfig.host) {
         logger.error('Critical production database configuration values are missing after environment variable processing.');
         process.exit(1);
    }
}

// Log the selected configuration (masking password)
const loggableConfig = { ...currentConfig, password: '***' };
logger.info(`Using database configuration for '${env}':`, loggableConfig);

module.exports = currentConfig;