// Filepath: migrations/YYYY...-create-user.js
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      user_id: { // Already snake_case
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      password_hash: { // Already snake_case
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      is_admin: { // Already snake_case
        type: Sequelize.BOOLEAN,
        defaultValue: true
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
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
  }
};