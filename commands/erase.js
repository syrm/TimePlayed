const tools = require("../tools");
const connection = tools.getConnection;
module.exports = function(obj) {
  var message = obj.message;
  var lang = obj.lang;
  message.reply(lang.commands.erase.confirmation).then(msg => {
    tools.awaitReaction(msg, ["✅"], message.author.id, function() {
      message.channel.send("<a:loading:455383347921682433> Deleting your playtime data...").then(loadingMSG => {
        tools.setTerms(message.author.id, false, function() {
          connection.query(`DELETE FROM playtime WHERE userID=${message.author.id}`, function(error, results, fields) {
            loadingMSG.edit("<a:loading:455383347921682433> Deleting your last online data...")
            connection.query(`DELETE FROM lastOnline WHERE userID=${message.author.id}`, function(error, results, fields) {
              loadingMSG.edit("<a:loading:455383347921682433> Deleting your start date...")
              connection.query(`DELETE FROM startDates WHERE userID=${message.author.id}`, function(error, results, fields) {
                loadingMSG.edit("Done! All your data is now completely erased.")
              })
            })
          })
        })
      })
    })
  })
}