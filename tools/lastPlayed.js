var connection = require('./connection.js');

module.exports = function(id, game, callback) {
  connection.query(`SELECT endDate FROM playtime WHERE userID=? AND game=? GROUP BY endDate DESC LIMIT 1`, [id, game], function(error, results, fields) {
    if(!results[0]) return callback(-1)
    return callback(results[0].endDate)
  })
}