// Filepath: migrations/YYYY...-create-favorite.js
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('favorites', {
      patron_id: { // Already snake_case
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        references: {
          model: 'patrons',
          key: 'patron_id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      song_id: { // Already snake_case
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        references: {
          model: 'songdb',
          key: 'song_id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      // CORRECTED to snake_case
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      }
      // No updated_at needed
    });
     await queryInterface.addIndex('favorites', ['patron_id']);
     await queryInterface.addIndex('favorites', ['song_id']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('favorites');
  }
};