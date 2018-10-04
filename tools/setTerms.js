var connection = require('./connection.js');

module.exports =  function(userID, accept, callback) {
  var num = 1;
  if(accept == false) num = 0;
  connection.query(`REPLACE INTO termsAccept (userID, accept) VALUES (${userID}, ${num})`, function(error, results, fields) {
    if(accept) {
      connection.query(`UPDATE INTO startDates (userID) VALUES (${userID})`, function(error, results, fields) {
        return callback()
      })
    } else {
      return callback()
    }
  })
}