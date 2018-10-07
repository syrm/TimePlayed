var tools = require('./index.js')
var connection = require('./connection.js');

module.exports =  function(id, game, sinces, callback) {
  if(!sinces) {
    return callback()
  }
  connection.query("SET CHARACTER SET utf8mb4", function(error, results, fields) {
    connection.query(`SELECT game, startDate, endDate FROM playtime WHERE userID=${id} AND game=?`, [game], function(error, permResults, fields) {
      var results = [];
      sinces.forEach(sinceString => {
        var msCount = 0;
        var since = tools.convert.sinceDate(sinceString)
        permResults.forEach(function(result, i) {
          if(!result.endDate) {
            if(i != results.length - 1) {
              return;
            } else {
              result.endDate = new Date()
            }
          }
          var diffMS = 0;
          if(result.endDate > since) {
            if(result.startDate < since) {
              diffMS = Math.abs(result.endDate.getTime() - since.getTime())
            }
            if(result.startDate > since) {
              diffMS = Math.abs(result.endDate.getTime() - result.startDate.getTime());
            }
          }
          if(diffMS > 0) msCount += diffMS
        })
        results[sinceString] = Math.floor(msCount / 1000)
      })
      return callback(results)
    });
  })
}