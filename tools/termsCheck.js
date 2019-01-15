var connection = require('./connection.js');
module.exports =  function(executerID, mentionID, guildID, callback) {
  var mentionStatement = ``
  if(mentionID) mentionStatement = ` OR userID=?`
  connection.query(`SELECT * FROM termsAccept WHERE userID=?${mentionStatement}`, [executerID, mentionID], function(error, results, fields) {
    if(error) throw error;
    var accepts = {}
    results.forEach(result => {
      if(result.userID == executerID) accepts.executer = true;
      if(result.userID == mentionID) accepts.mention = true;
    })
    connection.query("SELECT * FROM premium WHERE guildID=?", [guildID], function(error, results, fields) {
      var premium = false;
      if(results.length > 0) premium = true;
      return callback([accepts, premium])
    })
  })
}