// Categories
exports.convert = require('./convert.js')

// Connectoin
exports.getConnection = require('./connection.js')

// Individual functions
exports.timePlayed = require('./timePlayed.js')
exports.bulkTimeplayed = require('./bulkTimeplayed.js')
exports.bulkTimeplayedCustomSince = require('./bulkTimeplayedCustomSince.js')
exports.getGuildConfig = require('./getGuildConfig.js')
exports.getGuildConfigs = require('./getGuildConfigs.js')
exports.getStartDate = require('./getStartDate.js')
exports.topGames = require('./topGames.js')
exports.commandHandler = require('./commandHandler.js')
exports.termsCheck = require('./termsCheck.js')
exports.setTerms = require('./setTerms.js')
exports.lastPlayed = require('./lastPlayed.js')
exports.filterTerms = require('./filterTerms.js')

exports.replaceLang = require('./replaceLang.js')
exports.acceptCollector = require('./acceptCollector.js')
exports.getThumbnail = require('./getThumbnail.js')
exports.awaitReaction = require('./awaitReaction.js')