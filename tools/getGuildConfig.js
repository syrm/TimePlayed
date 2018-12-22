var tools = require('./index.js')
var connection = require('./connection.js');

var defaultValues = {
  prefix: "!!",
  defaultGame: "Fortnite"
}
function toConfig(result) {
  Object.keys(defaultValues).forEach(key => {
    if(!result[key]) {
      result[key] = defaultValues[key];
    }
  })
  var config = {
    prefix: result.prefix,
    rankingChannel: result.rankingChannel,
    defaultGame: result.defaultGame
  }
  return config;
}

module.exports = function(guildID, callback) {
  connection.query("SELECT prefix, rankingChannel, defaultGame FROM guildSettings WHERE guildID=?", [guildID], function(error, results, fields) {
    if(results.length < 1) {
      connection.query("INSERT INTO guildSettings (guildID, prefix, defaultGame) VALUES (?, '!!', 'Fortnite')", [guildID], function(error, results, fields) {
        tools.getGuildConfig(guildID, function(config) {
          callback(config)
        })
      })
    } else {
      callback(toConfig(results[0]))
    }
  })
}