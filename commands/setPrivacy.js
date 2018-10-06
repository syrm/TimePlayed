var tools = require("../tools")
var connection = tools.getConnection
module.exports = function(message, lang) {
  message.channel.send(lang.commands.setPrivacy.choices).then(msg => {
    tools.awaitReaction(msg, ["🇦", "🇧"], message.author.id, function(reaction, choice) {
      connection.query(`SELECT * FROM privacy WHERE userID=?`, [message.author.id], function(error, results, fields) {
        if(choice == 1) {
          connection.query(`DELETE FROM privacy WHERE userID=?`, [message.author.id], function(error, results, fields) {
            return message.reply(lang.commands.setPrivacy.setPublic)
          })
        }
        if(choice == 0) {
          connection.query("INSERT IGNORE INTO privacy (userID) VALUES (?)", [message.author.id], function(error, results, fields) {
            return message.reply(lang.commands.setPrivacy.setPrivate)
          })
        }
      })
    })
  })
}