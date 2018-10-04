var tools = require('./index.js')
const mysql = require('mysql')
const keys = require('../keys.json')
var pool = require('./pool.js')

module.exports =  function(guilds, callback) {
  if(guilds.length < 1) return callback()
  pool.getConnection(function(err, connection) {
    var permQuery = 'SELECT * FROM playtime WHERE '
    var done = [];
    guilds.forEach(function(guild, index) {
      var or = ' OR'
      if(index == 0) or = ''
      if(done.includes({guildID: guild.id, game: guild.game, since: guild.since})) return;
      permQuery += `${or} (userID IN (${connection.escape(guild.ids)}) AND game = ${connection.escape(guild.game)})`
      done.push({guildID: guild.id, game: guild.game, since: guild.since})
    })
    var tempQuery = 'SELECT * FROM currentusers WHERE '
    var done = [];
    guilds.forEach(function(guild, index) {
      var or = 'OR '
      if(index == guilds.length - 1) or = ''
      if(done.includes({guildID: guild.id, game: guild.game, since: guild.since})) return;
      tempQuery += `(userID IN (${connection.escape(guild.ids)}) AND game = ${connection.escape(guild.game)}) ${or}`
      done.push({guildID: guild.id, game: guild.game, since: guild.since})
    })
    connection.query(permQuery, function(error, permResults, fields) {
      if(error) throw error;
      connection.query(tempQuery, function(error, tempResults, fields) {
        if(error) throw error;
        var finalResults = []
        guilds.forEach((guild, index) => {
          var since = guild.since
          var guildResults = [];
          tempResults.forEach(value => {
            if(value.game.toLowerCase() != guild.game.toLowerCase() || guild.ids.includes(value.userID) == false) return;
            var msCount = 0;
            if(since == undefined || since == "") {
              msCount += Math.abs(new Date().getTime() - value.startDate.getTime())
            } else {
              if(tools.convert.sinceDate(since) > value.startDate) {
                msCount += Math.abs(tools.convert.sinceDate(since).getTime() - value.startDate.getTime())
              } else {
                msCount += Math.abs(new Date().getTime() - value.startDate.getTime())
              }
            }
            if(guildResults.some(e => e.id == value.userID)) {
              var i = guildResults.map(function(e) { return e.id; }).indexOf(value.userID);
              guildResults[i].minutes += msCount / 60000;
            } else {
              guildResults.push({id: value.userID, minutes: msCount / 60000})
            }
          })
          permResults.forEach(value => {
            if(value.game.toLowerCase() != guild.game.toLowerCase() || guild.ids.includes(value.userID) == false) return;
            var msCount = 0;
            if(since == undefined) {
              msCount += Math.abs(value.endDate.getTime() - value.startDate.getTime());
            } else {
              if(value.endDate > tools.convert.sinceDate(since)) {
                if(value.startDate < tools.convert.sinceDate(since)) {
                  msCount += Math.abs(value.endDate.getTime() - tools.convert.sinceDate(since).getTime())
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
        
        connection.release();
        return callback(finalResults)
      });
    });
  })
    
}