var connection = require('./connection.js');
var fs = require("fs");

module.exports = function(callback, onlyRoleAwards) {
  connection.query("SELECT prefix, rankingChannel, enableRankingMentions, defaultGame, leaderboardAmount, roleAwards FROM guildSettings", function(error, results, fields) {
    var configs = []
    results.forEach(result => {
      var enableRankingMentions = false;
      if(result.enableRankingMentions == 1) enableRankingMentions = true;
      if(onlyRoleAwards && result.roleAwards == "[]") return;
      configs.push({
        guildID: result.guildID,
        config: {
          prefix: result.prefix,
          rankingChannel: result.rankingChannel,
          enableRankingMentions: enableRankingMentions,
          defaultGame: result.defaultGame,
          leaderboardAmount: result.leaderboardAmount,
          roleAwards: JSON.parse(result.roleAwards)
        }
      })
    })
    callback(configs)
  })
}

// -------------- BETA --------------


var defaultValues = {
  prefix: "!!",
  defaultGame: "Fortnite",
  leaderboardLayout: fs.readFileSync("./tools/assets/default-leaderboard.txt"),
  leaderboardNoMoreToday: "No more users have played %game% today!",
  leaderboardNoMoreWeek: "No more users have played %game% this week!",
  leaderboardNoMoreAlways: "No more users have ever played %game%!",
  leaderboardNoToday: "No one has played %game% today!",
  leaderboardNoWeek: "No one has played %game% this week!",
  leaderboardNoAlways: "No one has ever played %game%!"
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
    defaultGame: result.defaultGame,
    leaderboardLayout: result.leaderboardLayout,
    
    leaderboardNoMoreToday: result.leaderboardNoMoreToday,
    leaderboardNoMoreWeek: result.leaderboardNoMoreWeek,
    leaderboardNoMoreAlways: result.leaderboardNoMoreAlways,

    leaderboardNoToday: result.leaderboardNoToday,
    leaderboardNoWeek: result.leaderboardNoWeek,
    leaderboardNoAlways: result.leaderboardNoAlways
  }
  return config;
}

module.exports.beta = function(callback) {
  connection.query("SELECT * FROM guildSettings WHERE guildID=433531223244013572", function(error, results, fields) {
    var configs = []
    results.forEach(result => {
      configs.push({
        guildID: result.guildID,
        config: toConfig(result)
      })
    })
    callback(configs)
  })
}