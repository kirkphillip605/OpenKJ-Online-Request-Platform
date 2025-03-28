// Filepath: seeders/YYYY...-initial-venues.js
'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('venues', [ // Table name: 'venues'
      {
        name: 'The Singing Spot',
        url_name: 'the-singing-spot', // Keep unique or set to null if not using
        accepting: true,
        address1: '123 Melody Lane',
        city: 'Anytown',
        state: 'CA',
        zip: '90210',
        lat: 34.0901, // Example coordinates
        lon: -118.4065, // Example coordinates
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Karaoke Korner',
        url_name: 'karaoke-korner', // Keep unique or set to null
        accepting: false,
        city: 'Somewhere Else',
        state: 'NY',
        zip: '10001',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('venues', null, {}); // Deletes all venues
  }
};