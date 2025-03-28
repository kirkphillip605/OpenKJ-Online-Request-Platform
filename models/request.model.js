// models/request.model.js
// (Keep the model definition as provided in the prompt)
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Request = sequelize.define('Request', {
    request_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    venue_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'venues', // Table name
        key: 'venue_id',
      },
      onUpdate: 'CASCADE',
      // onDelete: 'CASCADE' is implicitly set by Venue's hasMany if not specified here
    },
    artist: {
      type: DataTypes.STRING,
      allowNull: false, // Requests should always have artist/title
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    singer: {
      type: DataTypes.STRING,
      allowNull: false, // Singer name is essential
    },
    request_time: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW, // Set time when request is created
    },
    key_change: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
  }, {
    tableName: 'requests',
    timestamps: false, // Keep as false per original model
    indexes: [
        { fields: ['venue_id'] },
        { fields: ['request_time'] }
    ]
  });

  Request.associate = (models) => {
    Request.belongsTo(models.Venue, { foreignKey: 'venue_id', as: 'venue' });
  };

  return Request;
};