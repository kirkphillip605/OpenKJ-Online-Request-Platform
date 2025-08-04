// Filepath: migrations/YYYY...-create-state.js
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    // Temporarily disable the primary key requirement for this session
    await queryInterface.sequelize.query('SET SESSION sql_require_primary_key = OFF;');

    await queryInterface.createTable('state', {
      accepting: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      serial: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      }
      // No timestamps needed based on model
    });

    // Re-enable the primary key requirement for the session
    await queryInterface.sequelize.query('SET SESSION sql_require_primary_key = ON;');
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('state');
  }
};