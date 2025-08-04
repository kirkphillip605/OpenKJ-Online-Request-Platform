// Filepath: migrations/YYYY...-create-request.js
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('requests', {
      request_id: { // Already snake_case
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      venue_id: { // Already snake_case
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
        allowNull: false
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      singer: {
        type: Sequelize.STRING,
        allowNull: false
      },
      request_time: { // Already snake_case
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
      key_change: { // Already snake_case
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false // Made non-nullable based on model
      }
      // No timestamps needed based on model
    });
    await queryInterface.addIndex('requests', ['venue_id']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('requests');
  }
};