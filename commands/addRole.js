const tools = require("../tools");
var connection = tools.getConnection;

function getRole(string, guild) {
  if(string == undefined) return undefined;
  var roleID = string.replace("<@", "").replace(">", "");
  if(guild.roles.get(roleID) != undefined) return message.guild.roles.get(roleID);
  if(guild.roles.find("name", string) != undefined) return guild.roles.find("name", string);
  // If nothing was found, return undefined
  return undefined;
}

module.exports = function(obj) {
  var message = obj.message;
  var handledArgs = obj.handledArgs;
  var guildConf = obj.guildConf
  var lang = obj.lang;
  if(message.member.hasPermission("ADMINISTRATOR")) {
      if(message.guild.me.hasPermission("MANAGE_ROLES") == false) {
        return message.reply(lang.commands.addRole.noPermission)
      }
      var role = getRole(handledArgs.role, message.guild)
      if(!role) return message.reply(lang.commands.addRole.cantFindRole.replace("%role%", handledArgs.role))
      if(guildConf.roleAwards.length > 2 && !premium) return message.reply(lang.commands.addRole.threeRolesMax)
      if(guildConf.roleAwards.length > 9) return message.reply(lang.commands.addRole.tenRolesMax)

      // Check if the role is lower than the highest bot role
      var highestBotRole = message.guild.me.roles.sort(function(a, b) {
        return a.position < b.position
      }).first()
      if(role.position >= highestBotRole.position) return message.reply(lang.commands.addRole.roleTooHigh)

      // Check if award with the same role already exist
      var obj = {game: handledArgs.game, time: handledArgs.since.split("/")[0], per: handledArgs.since.split("/")[1], roleID: role.id}
      var same;
      guildConf.roleAwards.forEach(role => {
        if(role.roleID == obj.roleID) {
          same = true;
        }
      })
      if(same == true) return message.reply(lang.commands.addRole.alreadyAssigned)
      guildConf.roleAwards.push(obj)
      connection.query("UPDATE guildSettings SET roleAwards=?", [JSON.stringify(guildConf.roleAwards)], function(error, results, fields) {
        var str = lang.commands.addRole.success.replace("%role%", role).replace("%neededTime%", tools.convert.sinceToString(handledArgs.since.split("/")[0], true, true)).replace("%timePeriod%", tools.convert.sinceToString(handledArgs.since.split("/")[1], true))
        if(handledArgs.defaultGame) str += lang.commands.addRole.defaultGameNote
        return message.channel.send(str)
      })
    } else {
      return message.reply(lang.errors.noPermission)
    }
}