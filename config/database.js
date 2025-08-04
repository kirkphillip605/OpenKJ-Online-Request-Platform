// Filepath: config/database.js
require('dotenv').config();
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

const env = process.env.NODE_ENV || 'development';
logger.info(`Running in environment: ${env}`);

const baseConfig = {
  dialect: process.env.DB_DIALECT || 'mysql',
  logging: (msg) => logger.debug(msg),
  pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
  // --- SET underscored TO true ---
  define: { underscored: true }
};

const config = {
development: {
    ...baseConfig,
    username: process.env.DEV_DB_USER || 'dev-karaoke',
    password: process.env.DEV_DB_PASSWORD || null,
    database: process.env.DEV_DB_NAME || 'dev-karaoke',
    host: process.env.DEV_DB_HOST || 'vibe.kirknetllc.com',
    port: process.env.DEV_DB_PORT || 3306,
    dialect: process.env.DEV_DB_DIALECT || baseConfig.dialect,
    ...( (process.env.DEV_DB_SSL_ENABLED === 'true' && process.env.DEV_DB_SSL_CA) && {
        dialectOptions: {
            ssl: {
                ca: fs.readFileSync(path.join(__dirname, '..', process.env.DEV_DB_SSL_CA)),
                // Optionally add rejectUnauthorized if necessary:
                rejectUnauthorized: false
            }
        }
        })
},
  test: {
    ...baseConfig,
    username: process.env.TEST_DB_USER || process.env.DB_USER,
    password: process.env.TEST_DB_PASSWORD || process.env.DB_PASSWORD,
    database: process.env.TEST_DB_NAME || 'karaoke_db_test',
    host: process.env.TEST_DB_HOST || 'localhost',
    port: process.env.TEST_DB_PORT || 3306,
    dialect: process.env.TEST_DB_DIALECT || baseConfig.dialect,
    logging: false,
     ...( (process.env.TEST_DB_SSL_ENABLED === 'true' && process.env.TEST_DB_SSL_CA_PATH) && {
        dialectOptions: {
            ssl: {
                ca: fs.readFileSync(path.join(__dirname, '..', process.env.TEST_DB_SSL_CA_PATH)),
                rejectUnauthorized: false,
            }
        }
     })
  },
  production: {
    ...baseConfig,
    username: process.env.PROD_DB_USER,
    password: process.env.PROD_DB_PASSWORD,
    database: process.env.PROD_DB_NAME,
    host: process.env.PROD_DB_HOST,
    port: process.env.PROD_DB_PORT || 3306,
    dialect: process.env.PROD_DB_DIALECT || baseConfig.dialect,
    logging: (msg) => logger.info(msg),
    pool: {
        max: parseInt(process.env.PROD_DB_POOL_MAX || '10', 10),
        min: parseInt(process.env.PROD_DB_POOL_MIN || '2', 10),
        acquire: parseInt(process.env.PROD_DB_POOL_ACQUIRE || '60000', 10),
        idle: parseInt(process.env.PROD_DB_POOL_IDLE || '30000', 10)
    },
    ...( (process.env.PROD_DB_SSL_ENABLED === 'true' && process.env.PROD_DB_SSL_CA_PATH) && {
        dialectOptions: {
            ssl: {
                ca: fs.readFileSync(path.join(__dirname, '..', process.env.PROD_DB_SSL_CA_PATH)),
                rejectUnauthorized: process.env.PROD_DB_SSL_REJECT_UNAUTHORIZED !== 'false'
            }
        }
     })
  }
};

const currentConfig = config[env];

if (!currentConfig) {
  logger.error(`Invalid NODE_ENV specified: '${env}'. Configuration not found in config/database.js.`);
  process.exit(1);
}

if (env === 'production') {
    const requiredProdVars = ['PROD_DB_USER', 'PROD_DB_PASSWORD', 'PROD_DB_NAME', 'PROD_DB_HOST'];
     if (process.env.PROD_DB_SSL_ENABLED === 'true') {
         requiredProdVars.push('PROD_DB_SSL_CA_PATH');
     }
    const missingVars = requiredProdVars.filter(v => !process.env[v]);
    if (missingVars.length > 0) {
        logger.error(`Missing required production environment variables: ${missingVars.join(', ')}`);
        logger.error('These must be set in the production environment.');
        process.exit(1);
    }
     if (process.env.PROD_DB_SSL_ENABLED === 'true') {
         const caPath = path.join(__dirname, '..', process.env.PROD_DB_SSL_CA_PATH);
         if (!fs.existsSync(caPath)) {
             logger.error(`Production SSL CA file not found at path: ${caPath}`);
             process.exit(1);
         }
     }
}

const loggableConfig = { ...currentConfig };
if (loggableConfig.password) loggableConfig.password = '***';
if (loggableConfig.dialectOptions?.ssl?.ca) loggableConfig.dialectOptions.ssl.ca = '[CA Certificate Content Loaded]';
if (loggableConfig.dialectOptions?.ssl?.key) loggableConfig.dialectOptions.ssl.key = '[Client Key Content Loaded]';
if (loggableConfig.dialectOptions?.ssl?.cert) loggableConfig.dialectOptions.ssl.cert = '[Client Certificate Content Loaded]';

logger.info(`Using database configuration for '${env}':`, loggableConfig);

module.exports = currentConfig;