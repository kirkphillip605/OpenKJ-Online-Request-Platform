// models/state.model.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const State = sequelize.define('State', {
    accepting: { // Note: Venue-level accepting seems more practical? Keeping global for now.
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    serial: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  }, {
    tableName: 'state',
    primaryKey: false,
    timestamps: false,
  });
  State.removeAttribute('id');
  return State;
};