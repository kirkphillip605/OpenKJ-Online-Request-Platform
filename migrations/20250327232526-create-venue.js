'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('venues', {
      venue_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      url_name: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
      },
      accepting: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      address1: {
        type: Sequelize.STRING
      },
      address2: {
        type: Sequelize.STRING
      },
      city: {
        type: Sequelize.STRING
      },
      state: {
        type: Sequelize.STRING(2)
      },
      zip: {
        type: Sequelize.STRING(10)
      },
      lat: {
        type: Sequelize.DECIMAL(9, 7)
      },
      lon: {
        type: Sequelize.DECIMAL(10, 7)
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
    await queryInterface.addIndex('venues', ['url_name'], { unique: true });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('venues');
  }
};