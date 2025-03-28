'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('songdb', {
      song_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      artist: {
        type: Sequelize.STRING,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      combined: {
        type: Sequelize.STRING,
        allowNull: false
      }
    });
    await queryInterface.addIndex('songdb', ['artist']);
    await queryInterface.addIndex('songdb', ['title']);
    await queryInterface.addIndex('songdb', ['combined'], { unique: true });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('songdb');
  }
};