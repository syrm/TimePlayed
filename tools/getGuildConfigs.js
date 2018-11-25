var connection = require('./connection.js');
var fs = require("fs");

var defaultValues = {
  leaderboardLayout: fs.readFileSync("./tools/assets/default-leaderboard.txt"),
  leaderboardNoMoreToday: "No more users have played %game% today!",
  leaderboardNoMoreWeek: "No more users have played %game% this week!",
  leaderboardNoMoreAlways: "No more users have ever played %game%!",
  leaderboardNoToday: "No one has played %game% today!",
  leaderboardNoWeek: "No one has played %game% this week!",
  leaderboardNoAlways: "No one has ever played %game%!"
}

function toConfig(result) {
  var config = {
    prefix: result.prefix,
    rankingChannel: result.rankingChannel,
    defaultGame: result.defaultGame,
    leaderboardLayout: result.leaderboardLayout || defaultValues.leaderboardLayout,
    
    leaderboardNoMoreToday: result.leaderboardNoMoreToday || defaultValues.leaderboardNoMoreToday,
    leaderboardNoMoreWeek: result.leaderboardNoMoreWeek || defaultValues.leaderboardNoMoreWeek,
    leaderboardNoMoreAlways: result.leaderboardNoMoreAlways || defaultValues.leaderboardNoMoreAlways,

    leaderboardNoToday: result.leaderboardNoToday || defaultValues.leaderboardNoToday,
    leaderboardNoWeek: result.leaderboardNoWeek || defaultValues.leaderboardNoWeek,
    leaderboardNoAlways: result.leaderboardNoAlways || defaultValues.leaderboardNoAlways
  }
  return config;
}

module.exports = function(callback) {
  connection.query("SELECT * FROM guildSettings", function(error, results, fields) {
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