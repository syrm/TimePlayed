var connection = require('./connection.js');
module.exports =  function(arr, callback) {
  if(arr.length < 1) return callback([])
  var toCheck = arr.map(e => {return e[0].id})
  connection.query(`SELECT * FROM termsAccept WHERE (userID) IN (?)`, [toCheck], function(error, results, fields) {
      var accepted = results.map(e => e.userID);
      arr = arr.filter(e => accepted.includes(e[0].id))
      return callback(arr)
  })
}