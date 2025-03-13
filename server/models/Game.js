// server/models/Game.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Game = sequelize.define('Game', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  player1Id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  player2Id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  player1Score: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  player2Score: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  winnerId: {
    type: DataTypes.INTEGER
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

module.exports = Game;