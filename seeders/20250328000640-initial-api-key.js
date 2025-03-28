// Filepath: seeders/YYYY...-initial-api-key.js
'use strict';
const crypto = require('crypto');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Find the ID of the admin user created in the previous seed
    // Using Sequelize instance from queryInterface for flexibility
    const [users, metadata] = await queryInterface.sequelize.query(
      `SELECT user_id from users WHERE username = 'admin' LIMIT 1;` // Ensure table/column names match
    );

    if (!users || users.length === 0) {
      throw new Error('Could not find admin user (username: admin) to associate API key with. Ensure user seeder runs first and creates the user.');
    }
    const adminUserId = users[0].user_id;
    const generatedKey = crypto.randomBytes(32).toString('hex');

    // Log the generated key to the console so you know what it is!
    console.log('\n\n=================================================');
    console.log('Generated API Key for OpenKJ Testing:');
    console.log(generatedKey);
    console.log('Associated with Admin User ID:', adminUserId);
    console.log('=================================================\n\n');


    await queryInterface.bulkInsert('api_keys', [{ // Table name: 'api_keys'
      key: generatedKey,
      user_id: adminUserId,
      description: 'Test Key for OpenKJ Software',
      createdAt: new Date(),
      updatedAt: new Date()
      // last_used_at can be null initially
    }], {});
  },
  down: async (queryInterface, Sequelize) => {
    // Delete the specific key or all keys
    await queryInterface.bulkDelete('api_keys', { description: 'Test Key for OpenKJ Software' }, {});
    // Or: await queryInterface.bulkDelete('api_keys', null, {}); // Deletes all keys
  }
};