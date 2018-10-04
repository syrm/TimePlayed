var tools = require('./index.js')
const mysql = require('mysql')
const keys = require('../keys.json')
const fs = require('fs')
var pool = require('./pool.js')

module.exports = function(id, since, callback) {
  customSince = tools.convert.sinceDate(since, true)
  pool.getConnection(function(err, connection) {
    tools.getStartDate(id, function(startDate) {
      connection.query(`SELECT * FROM playtime WHERE userID=${id}`, function(error, results, fields) {
        connection.query(`SELECT * FROM currentusers WHERE userID=${id}`, function(error, currentResults, fields) {
          var games = [];
          currentResults.forEach(function(result) {
            var diffMS = 0;
            var now = new Date()
            if(result.startDate < customSince) {
              diffMS = Math.abs(now.getTime() - customSince.getTime())
            }
            if(result.startDate > customSince) {
              diffMS = Math.abs(now.getTime() - result.startDate.getTime());
            }
            if(diffMS > 0 && games.some(e => e.game == result.game)) {
                var index = games.map(e => {return e.game}).indexOf(result.game);
                games[index].time += diffMS;
            } else if(diffMS > 0) {
                games.push({game: result.game, time: diffMS})
            }
          })
          results.forEach(function(result) {
            var diffMS = 0;
            if(result.endDate > customSince) {
              if(result.startDate < customSince) {
                diffMS = Math.abs(result.endDate.getTime() - customSince.getTime())
              }
              if(result.startDate > customSince) {
                diffMS = Math.abs(result.endDate.getTime() - result.startDate.getTime());
              }
            }
            if(diffMS > 0 && games.some(e => e.game == result.game)) {
                var index = games.map(e => {return e.game}).indexOf(result.game);
                games[index].time += diffMS;
            } else if(diffMS > 0) {
                games.push({game: result.game, time: diffMS})
            }
          })
          games.sort(function(a, b){return b.time-a.time});
          connection.release();
          return callback(games)
        })
      })
    })
  })
}
