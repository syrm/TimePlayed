// Categories
exports.convert = require('./convert')

// Connectoin
exports.getConnection = require('./connection')

// Individual functions
exports.timePlayed = require('./timePlayed')
exports.bulkTimeplayed = require('./bulkTimeplayed')
exports.bulkTimeplayedCustomSince = require('./bulkTimeplayedCustomSince')
exports.getGuildConfig = require('./getGuildConfig')
exports.getGuildConfigs = require('./getGuildConfigs')
exports.getStartDate = require('./getStartDate')
exports.topGames = require('./topGames')
exports.commandHandler = require('./commandHandler')
exports.termsCheck = require('./termsCheck')
exports.setTerms = require('./setTerms')
exports.lastPlayed = require('./lastPlayed')
exports.filterTerms = require('./filterTerms')

exports.replaceLang = require('./replaceLang')
exports.getThumbnail = require('./getThumbnail')
exports.awaitReaction = require('./awaitReaction')

exports.correctGame = require('./correctGame')