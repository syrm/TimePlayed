var tools = require('./index.js')
var connection = require('./connection.js')

module.exports =  function(guilds, callback) {
  if(guilds.length < 1) return callback()
  var permQuery = 'SELECT * FROM playtime WHERE '
  var done = [];
  guilds.forEach(function(guild, index) {
    var or = ' OR'
    if(index == 0) or = ''
    if(done.includes({guildID: guild.id, game: guild.game, since: guild.since})) return;
    permQuery += `${or} (userID IN (${connection.escape(guild.ids)}) AND game = ${connection.escape(guild.game)})`
    done.push({guildID: guild.id, game: guild.game, since: guild.since})
  })
  connection.query(permQuery, function(error, permResults, fields) {
    var finalResults = []
    guilds.forEach((guild, index) => {
      var since = tools.convert.sinceDate(guild.since);
      var guildResults = [];
      permResults.forEach((value, i) => {
        if(!value.endDate) {
          if(i != permResults.length - 1) {
            return;
          } else {
            value.endDate = new Date()
          }
        }
        if(value.game.toLowerCase() != guild.game.toLowerCase() || guild.ids.includes(value.userID) == false) return;
        var msCount = 0;
        if(since == undefined) {
          msCount += Math.abs(value.endDate.getTime() - value.startDate.getTime());
        } else {
          if(value.endDate > since) {
            if(value.startDate < since) {
              msCount += Math.abs(value.endDate.getTime() - since.getTime())
            } else {
              msCount += Math.abs(value.endDate.getTime() - value.startDate.getTime());
            }
          }
        }
        if(guildResults.some(e => e.id == value.userID)) {
          var i = guildResults.map(function(e) { return e.id; }).indexOf(value.userID);
          guildResults[i].minutes += msCount / 60000;
        } else {
          guildResults.push({id: value.userID, minutes: msCount / 60000})
        }
      })
      finalResults.push({guildID: guild.guildID, game: guild.game, since: guild.since, results: guildResults})
    })
    return callback(finalResults)
  });
}