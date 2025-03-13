// server/models/index.js
const User = require('./User');
const Game = require('./Game');
const VerificationToken = require('./VerificationToken');

// Associations
Game.belongsTo(User, { as: 'player1', foreignKey: 'player1Id' });
Game.belongsTo(User, { as: 'player2', foreignKey: 'player2Id' });
Game.belongsTo(User, { as: 'winner', foreignKey: 'winnerId' });

User.hasMany(Game, { as: 'gamesAsPlayer1', foreignKey: 'player1Id' });
User.hasMany(Game, { as: 'gamesAsPlayer2', foreignKey: 'player2Id' });
User.hasMany(Game, { as: 'gamesWon', foreignKey: 'winnerId' });

VerificationToken.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(VerificationToken, { foreignKey: 'userId' });

module.exports = {
  User,
  Game,
  VerificationToken
};