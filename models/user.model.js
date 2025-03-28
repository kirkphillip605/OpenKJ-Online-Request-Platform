// models/user.model.js
// Filepath: models/user.model.js
const { DataTypes } = require('sequelize');
// Consider adding bcrypt for password hashing later
// const bcrypt = require('bcrypt');

module.exports = (sequelize) => {
    const User = sequelize.define('User', { 
        user_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        password_hash: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
        },
        is_admin: { 
            type: DataTypes.BOOLEAN,
            defaultValue: true, 
        },
    }, {
        tableName: 'users',
        timestamps: true,
        // Hooks for password hashing can be added here later
        // hooks: {
        //     beforeCreate: async (user) => {
        //         if (user.password_hash) {
        //             const salt = await bcrypt.genSalt(10);
        //             user.password_hash = await bcrypt.hash(user.password_hash, salt);
        //         }
        //     },
        //     beforeUpdate: async (user) => {
        //         if (user.changed('password_hash') && user.password_hash) {
        //             const salt = await bcrypt.genSalt(10);
        //             user.password_hash = await bcrypt.hash(user.password_hash, salt);
        //         }
        //     }
        // }
    });

    User.associate = (models) => {
        User.hasMany(models.ApiKey, { foreignKey: 'user_id', onDelete: 'cascade' });
    };

     // Instance method to compare password (add later with bcrypt)
    // User.prototype.validPassword = async function(password) {
    //     return await bcrypt.compare(password, this.password_hash);
    // };

    return User;
};