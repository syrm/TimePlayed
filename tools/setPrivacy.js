var connection = require('./connection.js');
module.exports = function(userID, guildID, choice, callback) {
  var num = 0
  if(choice == 2) num = 1
  var global = true;
  if(choice == 0) global = false;
  connection.query(`SELECT * FROM privateUsers WHERE userID=${userID}`, function(error, results, fields) {
    var already;
    // 0 is private, 1 is public
    results.forEach(result => {
      if(choice == 0 && result.guildID == guildID) {
        if(result.value == 0) {
          already = true
        } else {
          already = false
        }
      }
      if(choice == 1 && !result.guildID) {
        if(result.value == 0) {
          already = true
        } else {
          already = false
        }
      }
    })
    if(already == true) {
      return callback()
    }
    if(choice == 2) {
      connection.query(`DELETE FROM privateUsers WHERE userID=${userID}`, function(error, results, fields) {
        return callback()
      })
    }

    if(already == undefined && choice != 2) {
      var guild = ""
      var guildValue = ""
      if(!global) {guild = ", guildID"; guildValue = `, ${guildID}`}
      connection.query(`INSERT INTO privateUsers (userID, value${guild}) VALUES (${userID}, ${num}${guildValue})`, function(error, results, fields) {
        return callback()
      })
    }
    if(already == false && choice != 2) {
      var guildIDStatement = " IS NULL"
      if(!global) guildIDStatement = `=${guildID}`
      connection.query(`UPDATE privateUsers SET value=${num} WHERE userID=${userID} AND guildID${guildIDStatement}`, function(error, results, fields) {
        return callback()
      })
    }
  })
}