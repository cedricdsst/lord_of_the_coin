// server/models/VerificationToken.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const VerificationToken = sequelize.define('VerificationToken', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  }
});

module.exports = VerificationToken;