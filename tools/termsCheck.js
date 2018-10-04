var connection = require('./connection.js');
function convertBinary(bin) {
  if(bin == 1) return true;
  if(bin == 0) return false;
}
module.exports =  function(executerID, mentionID, guildID, callback) {
  var mentionStatement = ``
  if(mentionID) mentionStatement = ` OR userID=${mentionID}`
  connection.query(`SELECT * FROM termsAccept WHERE userID=${executerID}${mentionStatement}`, function(error, results, fields) {
    if(error) throw error;
    var accepts = {}
    results.forEach(result => {
      if(result.userID == executerID) accepts.executer = convertBinary(result.accept)
      if(result.userID == mentionID) accepts.mention = convertBinary(result.accept)
    })
    connection.query("SELECT * FROM premium WHERE guildID=?", [guildID], function(error, results, fields) {
      var premium = false;
      if(results.length > 0) premium = true;
      return callback([accepts, premium])
    })
    
  })
}