// models/songdb.model.js
// Filepath: models/songdb.model.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SongDB = sequelize.define('SongDB', {
    song_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    artist: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    combined: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    normalized_combined: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  }, {
    tableName: 'songdb',
    timestamps: false,
    indexes: [
        { fields: ['artist'] },
        { fields: ['title'] },
        { fields: ['normalized_combined'] },
    ]
  });

  SongDB.associate = (models) => {
  };

  return SongDB;
};