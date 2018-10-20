var tools = require("../tools")
var connection = tools.getConnection()
module.exports = function(obj) {
  var message = obj.message;
  var lang = obj.lang;
  message.channel.send(lang.commands.setPrivacy.choices).then(msg => {
    tools.awaitReaction(msg, ["🇦", "🇧"], message.author.id, function(reaction, choice) {
      if(choice == 1) {
        connection.query(`DELETE FROM privateUsers WHERE userID=?`, [message.author.id], function(error, results, fields) {
          return message.reply(lang.commands.setPrivacy.setPublic)
        })
      }
      if(choice == 0) {
        connection.query("INSERT IGNORE INTO privateUsers (userID) VALUES (?)", [message.author.id], function(error, results, fields) {
          return message.reply(lang.commands.setPrivacy.setPrivate)
        })
      }
    })
  })
}