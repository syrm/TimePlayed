var tools = require('./index.js')
var connection = require('./connection.js');

function toConfig(result) {
  var config = {
    prefix: result.prefix || "!!"
  }
  return config;
}

module.exports = function(guildID, callback) {
  connection.query("SELECT prefix FROM guildSettings WHERE guildID=?", [guildID], function(error, results, fields) {
    if(!results) return undefined;
    if(results.length < 1) {
      connection.query("INSERT INTO guildSettings (guildID, prefix) VALUES (?, '!!')", [guildID], function(error, results, fields) {
        tools.getGuildConfig(guildID, function(config) {
          callback(config)
        })
      })
    } else {
      callback(toConfig(results[0]))
    }
  })
}