// Filepath: models/patron.model.js
'use strict';
const { Model, Op } = require('sequelize'); // Import Op for conditional index

module.exports = (sequelize, DataTypes) => {
  class Patron extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Patrons can have many favorite songs, linked through the Favorite table
      Patron.belongsToMany(models.SongDB, {
        through: models.Favorite,      // The join table
        foreignKey: 'patron_id',     // Foreign key in the join table that points to Patron
        otherKey: 'song_id',         // Foreign key in the join table that points to SongDB
        as: 'favoriteSongs'          // Alias to access favorited songs from a Patron instance
      });

      // Optional: If you need direct access to the join table entries from a Patron instance
      // Patron.hasMany(models.Favorite, { foreignKey: 'patron_id' });
    }
  }
  Patron.init({
    patron_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: true, // Can be added later by patron
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: true, // Can be added later by patron
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true, // Required only for registered users who want favorites/login
      unique: 'unique_email_if_not_null', // Use a named unique constraint for clarity
      validate: {
        isEmail: {
            msg: "Must be a valid email address." // Custom validation message
        },
      },
    },
    mobile_number: {
      type: DataTypes.STRING,
      allowNull: true, // Required only if user provides it
      unique: 'unique_mobile_if_not_null', // Use a named unique constraint
      // Optional: Add validation for mobile number format if desired
      // validate: {
      //   is: /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/ // Example basic phone format regex
      // }
    },
    password_hash: {
      type: DataTypes.STRING,
      allowNull: true, // Required only for registered users
    },
  }, {
    sequelize,
    modelName: 'Patron',
    tableName: 'patrons',
    timestamps: true,
    indexes: [
        // Unique index on email only where email is NOT NULL
        // The 'unique' property in the column definition often handles this,
        // but an explicit index offers more control (like naming).
        {
            name: 'patrons_email_unique_if_not_null',
            unique: true,
            fields: ['email'],
            where: { email: { [Op.ne]: null } } // Sequelize operator for 'not equal'
        },
        // Unique index on mobile_number only where mobile_number is NOT NULL
        {
            name: 'patrons_mobile_unique_if_not_null',
            unique: true,
            fields: ['mobile_number'],
            where: { mobile_number: { [Op.ne]: null } }
        }
    ]
  });
  return Patron;
};