// models/apikey.model.js
const { DataTypes } = require('sequelize');
const crypto = require('crypto');

module.exports = (sequelize) => {
    const ApiKey = sequelize.define('ApiKey', {
        api_key_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        key: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            defaultValue: () => crypto.randomBytes(32).toString('hex'), // Generate secure random key
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users', // Table name
                key: 'user_id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        description: { // Optional: To help identify the key's purpose
            type: DataTypes.STRING,
        },
        last_used_at: { // Optional: Track key usage
            type: DataTypes.DATE,
        }
    }, {
        tableName: 'api_keys',
        timestamps: true, // Add createdAt and updatedAt
        indexes: [
            {
                unique: true,
                fields: ['key'],
            },
            {
                fields: ['user_id'],
            }
        ]
    });

    ApiKey.associate = (models) => {
        ApiKey.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    };

    return ApiKey;
};