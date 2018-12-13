var connection = require('./connection.js');

module.exports =  function(userID, accept, callback) {
  var num = 1;
  if(accept == false) num = 0;
  connection.query(`REPLACE INTO termsAccept (userID, accept) VALUES (?, ?)`, [userID, num], function(error, results, fields) {
    if(num == 1) {
      connection.query("INSERT IGNORE INTO loggedUsers (userID) VALUES (?)", [userID], function(err, results, fields) {
        return callback()
      })
    } else {
      connection.query("DELETE FROM loggedUsers WHERE userID = ?", [userID], function(err, results, fields) {
        return callback()
      })
    }
  })
}