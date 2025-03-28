// Filepath: seeders/YYYY...-initial-state.js
'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Ensure only one row exists - delete potential existing rows first for safety
    await queryInterface.bulkDelete('state', null, {}); // Clear table before inserting

    await queryInterface.bulkInsert('state', [{ // Table name: 'state'
        accepting: false, // Initial global accepting state
        serial: 0        // Initial serial value
        // No timestamps needed
    }], {});
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('state', null, {}); // Deletes the state row
  }
};