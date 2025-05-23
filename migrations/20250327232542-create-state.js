'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
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
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('state');
  }
};