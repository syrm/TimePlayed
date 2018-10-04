const mysql = require('mysql')
var pool = require('./pool.js')
module.exports =  function(userID, accept, callback) {
  var num = 1;
  if(accept == false) num = 0;
  // Moet nog start date insert komen
  pool.getConnection(function(err, connection) {
    connection.query(`REPLACE INTO termsAccept (userID, accept) VALUES (${userID}, ${num})`, function(error, results, fields) {
      connection.release()
      return callback()
    })
  })
}