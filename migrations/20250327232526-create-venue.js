// Filepath: migrations/YYYY...-create-venue.js
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('venues', {
      venue_id: { // Already snake_case
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      url_name: { // Already snake_case
        type: Sequelize.STRING,
        unique: true,
        allowNull: true // Changed based on previous correction
      },
      accepting: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      address1: {
        type: Sequelize.STRING
      },
      address2: {
        type: Sequelize.STRING
      },
      city: {
        type: Sequelize.STRING
      },
      state: {
        type: Sequelize.STRING(2)
      },
      zip: {
        type: Sequelize.STRING(10)
      },
      lat: {
        type: Sequelize.DECIMAL(9, 7)
      },
      lon: {
        type: Sequelize.DECIMAL(10, 7)
      },
      // CORRECTED to snake_case
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      // CORRECTED to snake_case
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
    await queryInterface.addIndex('venues', ['url_name'], { unique: true });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('venues');
  }
};