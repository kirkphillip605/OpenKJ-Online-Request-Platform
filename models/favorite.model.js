// Filepath: models/favorite.model.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Favorite extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     * Associations involving THIS join table are typically defined
     * in the models being joined (Patron and SongDB using belongsToMany).
     */
    static associate(models) {
      // Optional: Define direct belongsTo if needed for specific queries on the Favorite table itself.
      // Favorite.belongsTo(models.Patron, { foreignKey: 'patron_id' });
      // Favorite.belongsTo(models.SongDB, { foreignKey: 'song_id' });
    }
  }
  Favorite.init({
    // Composite primary key using the foreign keys
    patron_id: {
      type: DataTypes.INTEGER,
      primaryKey: true, // Part 1 of composite PK
      allowNull: false,
      references: {
        model: 'patrons', // Table name for Patron model
        key: 'patron_id',
      },
      onDelete: 'CASCADE', // If patron is deleted, remove their favorites
      onUpdate: 'CASCADE',
    },
    song_id: {
      type: DataTypes.INTEGER,
      primaryKey: true, // Part 2 of composite PK
      allowNull: false,
      references: {
        model: 'songdb', // Table name for SongDB model
        key: 'song_id',
      },
      onDelete: 'CASCADE', // If song is deleted, remove it from favorites
      onUpdate: 'CASCADE',
    },
    // 'createdAt' timestamp will be automatically added by Sequelize
  }, {
    sequelize,
    modelName: 'Favorite',
    tableName: 'favorites',
    timestamps: true,   // Automatically add `createdAt`
    updatedAt: false,   // Don't add/track `updatedAt`
    // No need for separate `id` column when using composite primary key like this
    indexes: [
        // The composite primary key implicitly creates a unique index on (patron_id, song_id)
        // Add indexes on individual foreign keys for faster lookups filtering by only one side
        { fields: ['patron_id'] },
        { fields: ['song_id'] },
    ]
  });

  // Optional: If Sequelize still adds an 'id' column despite composite PK definition, uncomment below
  // Favorite.removeAttribute('id');

  return Favorite;
};