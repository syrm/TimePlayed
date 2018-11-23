const tools = require("../tools");
var connection = tools.getConnection;
module.exports = function(obj) {
  var message = obj.message;
  var handledArgs = obj.handledArgs;
  var guildConf = obj.guildConf;
  var lang = obj.lang;

  var arg = [handledArgs.other];
  if(message.member.hasPermission("ADMINISTRATOR")) {
    connection.query("SELECT * FROM roleAwards WHERE guildID=?", [message.guild.id], function(error, results, fields) {
      if(arg[0] == undefined || isNaN(arg[0]) || Number(arg[0] - 1) > results.length || Number(arg[0]) <= 0) {
        var string = `Which role would you like to remove? Please choose from the choices below and type \`${guildConf.prefix}removeRole (number)\` to remove that role.\n**Current role awards:**\n`
        if(results.length < 1) {
          return message.reply(`This server doesn't have any role awards, so there's nothing to remove!`)
        }
        results.forEach((award, i) => {
          var role = message.guild.roles.get(award.roleID)
          if(role) {
            string += `**${i + 1}:** Game: \`${award.game}\`, time needed: \`${tools.convert.secondsToTime(award.time, true)}/${tools.convert.secondsToTime(award.per, true)}\`, awarded role: ${role}\n`
          } else {
            string += `**${i + 1}:** \`(deleted role, please remove this award)\`\n`
          }
        })
        string += "\nIf you're having trouble adding a role award, you can very easily add role awards on the website at http://www.timeplayed.xyz/dashboard/"
        return message.reply(string)
      } else {
        var roleIndex = Number(arg[0] - 1)
        var roleObj = results[roleIndex]
        var roleMention = message.guild.roles.get(roleObj.roleID)
        if(!roleMention) roleMention = "(deleted role)"
        connection.query("DELETE FROM roleAwards WHERE roleID=?", [roleObj.roleID], function(error, results, fields) {
          return message.reply(`Succesfully removed the ${roleMention} role award when playing more than \`${tools.convert.secondsToTime(roleObj.time, true)}/${tools.convert.secondsToTime(roleObj.per, true)}\` \`${roleObj.game}\``)
        })
      }
    })
    
  } else {
    return message.reply(lang.errors.noPermission)
  }
}