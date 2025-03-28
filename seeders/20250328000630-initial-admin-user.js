// Filepath: seeders/YYYY...-initial-admin-user.js
'use strict';
const bcrypt = require('bcrypt');
const saltRounds = 10; // Cost factor for hashing

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // --- IMPORTANT: Replace 'your_secure_password' with a real password ---
    const password = 'admin';
    if (password === 'admin') {
        console.warn('\n\nWARNING: Using default password in user seeder. Please change this!\n\n');
        // You might want to throw an error here in a real application to prevent default passwords
        // throw new Error('Default password detected in user seeder. Please set a secure password.');
    }
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    await queryInterface.bulkInsert('users', [{ // Table name: 'users'
      username: 'admin',
      password_hash: hashedPassword,
      email: 'admin@example.com',
      is_admin: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the specific user or all users depending on needs
    await queryInterface.bulkDelete('users', { username: 'admin' }, {});
    // Or: await queryInterface.bulkDelete('users', null, {}); // Deletes all users
  }
};