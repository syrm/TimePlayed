var tools = require('./index.js')
const mysql = require('mysql')
const keys = require('../keys.json')
var pool = require('./pool.js')

module.exports =  function(guilds, sinces, callback) {
  if(!sinces) {
    return callback()
  }
  if(guilds.length < 1) return callback()
  
  pool.getConnection(function(err, connection) {
    var permQuery = 'SELECT * FROM playtime WHERE '
    guilds.forEach(function(guild, index) {
      var or = 'OR '
      var sinceCondition = ''
      if(index == guilds.length - 1) or = ''
      if(guild.sinceDate != undefined) sinceCondition = ` AND endDate > ${connection.escape(guild.sinceDate)}`
      permQuery += `(userID IN (${connection.escape(guild.ids)}) AND game = ${connection.escape(guild.game)}${sinceCondition}) ${or}`
    })
    var tempQuery = 'SELECT * FROM currentusers WHERE '
    guilds.forEach(function(guild, index) {
      var or = 'OR '
      var sinceCondition = ''
      if(index == guilds.length - 1) or = ''
      if(guild.sinceDate != undefined) sinceCondition = ` AND endDate > ${connection.escape(guild.sinceDate)}`
      tempQuery += `(userID IN (${connection.escape(guild.ids)}) AND game = ${connection.escape(guild.game)}${sinceCondition}) ${or}`
    })

    connection.query(permQuery, function(error, permResults, fields) {
      if(error) throw error;
      connection.query(tempQuery, function(error, tempResults, fields) {
        if(error) throw error;
        var finalResults = []
        guilds.forEach((guild, index) => {
          var guildResults = [];
          sinces.forEach(since => {
            var sinceResults = []
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
              if(sinceResults.some(e => e.id == value.userID)) {
                var i = sinceResults.map(function(e) { return e.id; }).indexOf(value.userID);
                sinceResults[i].minutes += msCount / 60000;
              } else {
                sinceResults.push({id: value.userID, minutes: msCount / 60000})
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
              if(sinceResults.some(e => e.id == value.userID)) {
                var i = sinceResults.map(function(e) { return e.id; }).indexOf(value.userID);
                sinceResults[i].minutes += msCount / 60000;
              } else {
                sinceResults.push({id: value.userID, minutes: msCount / 60000})
              }
            })
            guildResults.push(sinceResults)
          })
          finalResults.push({guildID: guild.guildID, results: guildResults})
        })
        
        connection.release();
        return callback(finalResults)
      });
    });
  })
    
}