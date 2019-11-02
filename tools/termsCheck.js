var connection = require('./connection.js');
module.exports =  function(executerID, mentionID, callback) {
  var mentionStatement = ``
  if(mentionID) mentionStatement = ` OR userID=?`
  connection.query(`SELECT * FROM termsAccept WHERE userID=?${mentionStatement}`, [executerID, mentionID], function(error, results, fields) {
    if(error) throw error;
    var accepts = {}
    results.forEach(result => {
      if(result.userID == executerID) accepts.executer = true;
      if(result.userID == mentionID) accepts.mention = true;
    })
    return callback(accepts)
  })
}