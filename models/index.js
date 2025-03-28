// models/index.js
'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const config = require(__dirname + '/../config/database.js'); // Use database.js
const logger = require('../utils/logger');
const db = {};

logger.info(`Initializing Sequelize with dialect: ${config.dialect}`);

const sequelize = new Sequelize(config.database, config.username, config.password, config);

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-9) === '.model.js'); // Ensure it's a model file
  })
  .forEach(file => {
    try {
      const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
      db[model.name] = model;
      logger.debug(`Loaded model: ${model.name}`);
    } catch (error) {
        logger.error(`Error loading model ${file}:`, error);
    }
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
    logger.debug(`Associated model: ${modelName}`);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Test connection function
db.connectDB = async () => {
    try {
        await sequelize.authenticate();
        logger.info('Database connection has been established successfully.');
        // IMPORTANT: Sync only in development, use migrations in production
        if (process.env.NODE_ENV === 'development') {
             // Use { alter: true } or { force: true } cautiously in dev
            // await sequelize.sync({ alter: true }); // Tries to alter tables to match models
            // logger.warn('Database synchronized with models (alter: true)');
        }
    } catch (error) {
        logger.error('Unable to connect to the database:', error);
        process.exit(1); // Exit if DB connection fails
    }
};

// Utility to ensure the state row exists
db.ensureStateRow = async () => {
    const State = db.State;
    try {
        const count = await State.count();
        if (count === 0) {
            await State.create({ serial: 0, accepting: false });
            logger.info('Initialized the state table with a default row.');
        } else {
            logger.debug('State table row already exists.');
        }
    } catch (error) {
        logger.error('Error ensuring state table row:', error);
    }
};


module.exports = db;