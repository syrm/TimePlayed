var tools = require('./index.js')
var connection = require('./connection.js');
var fs = require("fs");

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



// ------------- BETA VERSION -------------



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
function toConfig2(result) {
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
    leaderboardLayout: result.leaderboardLayout
  }
  return config;
}

module.exports.beta = function(guildID, callback) {
  connection.query("SELECT * FROM guildSettings WHERE guildID=?", [guildID], function(error, results, fields) {
    if(results.length < 1) {
      connection.query("INSERT INTO guildSettings (guildID) VALUES (?)", [guildID], function(error, results, fields) {
        tools.getGuildConfig(guildID, function(config) {
          callback(config)
        })
      })
    } else {
      callback(toConfig2(results[0]))
    }
  })
}