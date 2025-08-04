// Filepath: migrations/YYYY...-create-patron.js
'use strict';
const { Op } = require('sequelize'); // Keep Op import

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('patrons', {
      patron_id: { // Already snake_case
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      first_name: { // Already snake_case
        type: Sequelize.STRING,
        allowNull: true
      },
      last_name: { // Already snake_case
        type: Sequelize.STRING,
        allowNull: true
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true
      },
      mobile_number: { // Already snake_case
        type: Sequelize.STRING,
        allowNull: true
      },
      password_hash: { // Already snake_case
        type: Sequelize.STRING,
        allowNull: true
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

    // Add indexes using snake_case column names
    await queryInterface.addIndex(
      'patrons',
      ['email'],
      {
        unique: true,
        where: { email: { [Op.ne]: null } },
        name: 'patrons_email_unique_if_not_null'
      }
    );
    await queryInterface.addIndex(
      'patrons',
      ['mobile_number'], // Corrected column name
      {
        unique: true,
        where: { mobile_number: { [Op.ne]: null } }, // Corrected column name
        name: 'patrons_mobile_unique_if_not_null'
      }
    );
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('patrons');
  }
};