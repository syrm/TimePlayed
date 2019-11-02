const tools = require("../tools");
var connection = tools.getConnection;
module.exports = function(obj) {
    var message = obj.message;
    var handledArgs = obj.handledArgs;
    var lang = obj.lang;
    if(handledArgs.other) {
      if(message.member.hasPermission("MANAGE_GUILD")) {
        if(handledArgs.other.length > 10) {
          message.channel.send(lang.commands.setPrefix.tooLong)
        } else {
          connection.query("UPDATE guildSettings SET prefix=? WHERE guildID=?", [handledArgs.other, message.guild.id], function(error, results, fields) {
            if(error) {
              message.channel.send("Sorry, an error has occured while inserting your prefix into the database. Please try again later or contact support.")
            } else {
              message.channel.send(lang.commands.setPrefix.success.replace("%newPrefix%", handledArgs.other))
            }

          })

        }
      } else {
          message.channel.send(lang.errors.noPermission)
      }
    } else {
      var msg = lang.commands.setPrefix.prefixMessage
      if(message.member.hasPermission("MANAGE_GUILD")) {
        msg += "\n" + lang.commands.setPrefix.toChange
      }
      message.channel.send(msg)
    }
    
}