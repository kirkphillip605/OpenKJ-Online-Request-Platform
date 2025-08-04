// Filepath: seeders/YYYY...-initial-api-key.js
'use strict';
const crypto = require('crypto');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const [users, metadata] = await queryInterface.sequelize.query(
      `SELECT user_id from users WHERE username = 'admin' LIMIT 1;` // Query uses snake_case (correct)
    );

    if (!users || users.length === 0) {
      throw new Error('Could not find admin user (username: admin) to associate API key with. Ensure user seeder runs first and creates the user.');
    }
    const adminUserId = users[0].user_id;
    const generatedKey = crypto.randomBytes(32).toString('hex');

    console.log('\n\n=================================================');
    console.log('Generated API Key for OpenKJ Testing:');
    console.log(generatedKey);
    console.log('Associated with Admin User ID:', adminUserId);
    console.log('=================================================\n\n');

    await queryInterface.bulkInsert('api_keys', [{
      key: generatedKey,
      user_id: adminUserId, // snake_case correct
      description: 'Test Key for OpenKJ Software',
      // Use snake_case for explicit column mapping in bulkInsert if needed,
      // though Sequelize might map camelCase model attributes automatically here.
      // Being explicit with snake_case matching the DB is safest.
      created_at: new Date(), // CORRECTED
      updated_at: new Date()  // CORRECTED
    }], {});
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('api_keys', { description: 'Test Key for OpenKJ Software' }, {});
  }
};