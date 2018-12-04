var connection = require('./connection.js');

module.exports =  function(userID, accept, callback) {
  var num = 1;
  if(accept == false) num = 0;
  connection.query(`REPLACE INTO termsAccept (userID, accept) VALUES (${userID}, ${num})`, function(error, results, fields) {
    return callback()
  })
}