var connection = require('./connection.js');

module.exports =  function(callback) {
  connection.query("SELECT game, time, per, roleID FROM roleAwards", [ids], function(error, results, fields) {
    console.log(results);
  })
}