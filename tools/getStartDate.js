var connection = require('./connection.js');

module.exports = function(userID, callback) {
  connection.query(`SELECT date FROM termsAccept WHERE userID=?`, [userID], function(error, results, fields) {
    console.log(results);
    if(results.length > 0 && results[0].startDate) {
      return callback(results[0].date);
    }
    callback();
  })
}