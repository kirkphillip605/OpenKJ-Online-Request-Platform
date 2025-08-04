// Filepath: seeders/YYYY...-initial-admin-user.js
'use strict';
const bcrypt = require('bcrypt');
const { Op } = require('sequelize'); // Import Op for OR condition
const saltRounds = 10;

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const adminUsername = 'admin';
    const adminEmail = 'admin@example.com';
    const password = 'admin'; // Use the actual password you intend to set

    if (password === 'admin') {
      console.warn('\n\nWARNING: Using default password "admin" in user seeder. This is insecure. Please change it.\n\n');
    }

    try {
      // Ensure the user doesn't already exist before attempting insert
      // This helps avoid unique constraint violations if the seeder is run multiple times
      // or if the down function didn't fully clean up.
      await queryInterface.bulkDelete('users', {
        [Op.or]: [
          { username: adminUsername },
          { email: adminEmail }
        ]
      }, {});

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Insert the new admin user
      await queryInterface.bulkInsert('users', [{
        username: adminUsername,
        password_hash: hashedPassword,
        email: adminEmail,
        is_admin: true,
        created_at: new Date(), // snake_case
        updated_at: new Date()  // snake_case
      }], {});

      console.log(`Admin user '${adminUsername}' seeded successfully.`);

    } catch (error) {
        console.error(`Error seeding admin user '${adminUsername}':`, error);
        // Rethrow the error to ensure the seed process fails if something goes wrong
        throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
        // Delete the specific user during rollback
        const deleted = await queryInterface.bulkDelete('users', {
             username: 'admin'
        }, {});
        console.log(`Deleted ${deleted} admin user row(s) during seeder rollback.`);
    } catch (error) {
        console.error(`Error rolling back admin user seeder:`, error);
        throw error;
    }
  }
};