var connection = require('./connection.js');

module.exports = function(userID, callback) {
  connection.query(`SELECT * FROM startDates WHERE userID=?`, [userID], function(error, results, fields) {
    if(results.length > 0) {
      return callback(results[0].startDate);
    } else {
      connection.query(`INSERT INTO startDates (userID) VALUES (?)`, [userID], function(error, results, fields) {
        return callback()
      })
    }
  })
}