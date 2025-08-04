// Filepath: migrations/YYYY...-create-api-key.js
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('api_keys', {
      api_key_id: { // Already snake_case
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      key: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      user_id: { // Already snake_case
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      description: {
        type: Sequelize.STRING
      },
      last_used_at: { // Already snake_case
        type: Sequelize.DATE
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
    await queryInterface.addIndex('api_keys', ['user_id']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('api_keys');
  }
};