var connection = require('./connection.js');

module.exports =  function(userID, guildID, callback) {
  if(!userID || guildID == "pm") return callback(false)
  connection.query(`SELECT * FROM privacy WHERE userID=${userID}`, function(error, results, fields) {
    var private = false;
    results.forEach(result => {
      if(result.value == 0) {
        private = true;
      }
    })
    return callback(private)
  })
}