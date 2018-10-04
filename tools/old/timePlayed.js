var tools = require('./index.js')
var pool = require('./pool.js')

module.exports =  function(id, game, sinces, noCorrectionFilter, callback) {
  if(!sinces) {
    return callback()
  }
  pool.getConnection(function(err, connection) {
    connection.query("SET CHARACTER SET utf8mb4", function(error, results, fields) {
      connection.query(`SELECT game, startDate, endDate FROM playtime WHERE userID=${id} AND game=?`, [game], function(error, permResults, fields) {
        if(error) throw error;
        connection.query(`SELECT startDate FROM currentusers WHERE userID=${id} AND game=?`, [game], function(error, currentResults, fields) {
          if(error) throw error;
          var results = [];
          sinces.forEach(sinceString => {
            var msCount = 0;
            var since = tools.convert.sinceDate(sinceString)
            var now = new Date()
            currentResults.forEach(function(result) {
              var diffMS;
              if(result.startDate < since) {
                var diffMS = Math.abs(now.getTime() - since.getTime())
              }
              if(result.startDate > since) {
                var diffMS = Math.abs(now.getTime() - result.startDate.getTime());
              }
              if(diffMS > 0) msCount += diffMS
            })
            permResults.forEach(function(result) {
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
            results[sinceString] = Math.floor(msCount / 60000)
          })
          connection.release();
          return callback(results)
        });
      });
    })
    
  })
    
}