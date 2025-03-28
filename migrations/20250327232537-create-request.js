'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('requests', {
      request_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      venue_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'venues',
          key: 'venue_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      artist: {
        type: Sequelize.STRING,
        allowNull: false // ADD this
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false // ADD this
      },
      singer: {
        type: Sequelize.STRING,
        allowNull: false // ADD this
      },
      request_time: {
        type: Sequelize.DATE,
        // Use Sequelize function for default CURRENT_TIMESTAMP for cross-db compatibility
        defaultValue: Sequelize.fn('NOW') // ADD or MODIFY this (or Sequelize.NOW)
      },
      key_change: {
        type: Sequelize.INTEGER,
        defaultValue: 0 // ADD or MODIFY this
      }
    });
    await queryInterface.addIndex('requests', ['venue_id']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('requests');
  }
};