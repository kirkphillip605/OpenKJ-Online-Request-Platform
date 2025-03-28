// Filepath: seeders/YYYY...-initial-songs.js
'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('songdb', [ // Table name: 'songdb'
      {
        artist: 'Queen',
        title: 'Bohemian Rhapsody',
        combined: 'Queen - Bohemian Rhapsody',
      },
      {
        artist: 'Journey',
        title: "Don't Stop Believin'", // Apostrophe needs escaping in direct SQL, but often okay here
        combined: "Journey - Don't Stop Believin'",
      },
      {
        artist: 'ABBA',
        title: 'Dancing Queen',
        combined: 'ABBA - Dancing Queen',
      },
      {
        artist: 'Neil Diamond',
        title: 'Sweet Caroline',
        combined: 'Neil Diamond - Sweet Caroline',
      },
      {
         artist: 'Garth Brooks',
         title: 'Friends In Low Places',
         combined: 'Garth Brooks - Friends In Low Places',
      }
      // Add more sample songs if desired
    ], {
        // Optional: If you might re-run seeds, ignore duplicates based on 'combined' key
        // ignoreDuplicates: true // Check dialect support if using this
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('songdb', null, {}); // Deletes all songs
  }
};