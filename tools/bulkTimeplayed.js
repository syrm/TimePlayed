var tools = require('./index.js')
const mysql = require('mysql')
const keys = require('../keys.json')
var connection = require('./connection.js')

module.exports =  function(guilds, sinces, callback) {
  if(!sinces) {
    return callback()
  }
  if(guilds.length < 1) return callback()
  
  var permQuery = 'SELECT * FROM playtime WHERE '
  guilds.forEach(function(guild, index) {
    var or = 'OR '
    var sinceCondition = ''
    if(index == guilds.length - 1) or = ''
    if(guild.sinceDate != undefined) sinceCondition = ` AND endDate > ${connection.escape(guild.sinceDate)}`
    permQuery += `(userID IN (${connection.escape(guild.ids)}) AND game = ${connection.escape(guild.game)}${sinceCondition}) ${or}`
  })

  connection.query(permQuery, function(error, permResults, fields) {
    var finalResults = []
    guilds.forEach((guild, index) => {
      var guildResults = [];
      sinces.forEach(since => {
        var sinceResults = []
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
    return callback(finalResults)
  });
}