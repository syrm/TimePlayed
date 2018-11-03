var connection = require('./connection.js');
module.exports =  function(arr, callback) {
  if(arr.length < 1) return callback([])
  var toCheck = arr.map(e => {return e[0].id})
  connection.query(`SELECT * FROM termsAccept WHERE (userID) IN (?)`, [toCheck], function(error, results, fields) {
    var accepted = []
    results.forEach(result => {
      if(result.accept == 1) {
        accepted.push(arr[toCheck.indexOf(result.userID)]);
      }
    })
    return callback(accepted)
  })
}