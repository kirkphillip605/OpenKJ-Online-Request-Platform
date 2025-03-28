// models/venue.model.js
// Filepath: models/venue.model.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Venue = sequelize.define('Venue', {
    venue_id: { // Explicitly define as primary key
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    url_name: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
    },
    accepting: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    address1: { type: DataTypes.STRING },
    address2: { type: DataTypes.STRING },
    city: { type: DataTypes.STRING },
    state: { type: DataTypes.STRING(2) },
    zip: { type: DataTypes.STRING(10) },
    lat: { type: DataTypes.DECIMAL(9, 7) },
    lon: { type: DataTypes.DECIMAL(10, 7) },
  }, {
    tableName: 'venues',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['url_name'] }
    ]
  });

  Venue.associate = (models) => {
    Venue.hasMany(models.Request, { foreignKey: 'venue_id', onDelete: 'cascade' });
  };

  return Venue;
};