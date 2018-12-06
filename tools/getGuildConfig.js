var tools = require('./index.js')
var connection = require('./connection.js');

var defaultValues = {
  prefix: "!!",
  defaultGame: "Fortnite",
  roleAwards: "[]"
}
function toConfig(result) {
  Object.keys(defaultValues).forEach(key => {
    if(!result[key]) {
      result[key] = defaultValues[key];
    }
  })
  enableRankingMentions = false;
  if(result.enableRankingMentions == 1) enableRankingMentions = true;
  var config = {
    prefix: result.prefix,
    rankingChannel: result.rankingChannel,
    enableRankingMentions: enableRankingMentions,
    defaultGame: result.defaultGame,
    leaderboardAmount: result.leaderboardAmount,
    roleAwards: JSON.parse(result.roleAwards)
  }
  return config;
}

module.exports = function(guildID, callback) {
  connection.query("SELECT prefix, rankingChannel, enableRankingMentions, defaultGame, leaderboardAmount, roleAwards FROM guildSettings WHERE guildID=?", [guildID], function(error, results, fields) {
    if(results.length < 1) {
      connection.query("INSERT INTO guildSettings (guildID, prefix, defaultGame, roleAwards) VALUES (?, '!!', 'Fortnite', '[]')", [guildID], function(error, results, fields) {
        tools.getGuildConfig(guildID, function(config) {
          callback(config)
        })
      })
    } else {
      callback(toConfig(results[0]))
    }
  })
}