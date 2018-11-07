const tools = require("../tools");
var connection = tools.getConnection;

function getRole(string, guild, message) {
  if(string == undefined) return undefined;
  var roleID = string.replace("<@", "").replace(">", "");
  if(guild.roles.get(roleID) != undefined) return message.guild.roles.get(roleID);
  if(guild.roles.find(e => e.name == string) != undefined) return guild.roles.find(e => e.name == string);
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
      var role = getRole(handledArgs.role, message.guild, message)
      if(!role) return message.reply(lang.commands.addRole.cantFindRole.replace("%role%", handledArgs.role))
      if(guildConf.roleAwards.length > 2 && !premium) return message.reply(lang.commands.addRole.threeRolesMax)
      if(guildConf.roleAwards.length > 9) return message.reply(lang.commands.addRole.tenRolesMax)

      // Check if the role is lower than the highest bot role
      var highestBotRole = message.guild.me.roles.sort(function(a, b) {
        return a.position < b.position
      }).first()
      if(role.position >= highestBotRole.position) return message.reply(lang.commands.addRole.roleTooHigh)

      // Check if award with the same role already exist
      connection.query("SELECT roleID FROM roleAwards WHERE guildID=? AND roleID=?", [message.guild.id, role.id], function(error, results, fields) {
        var same = false;
        if(results.length > 0) same = true;
        if(same) return message.reply(lang.commands.addRole.alreadyAssigned)

        // Insert the award
        var timeSeconds = tools.convert.stringToSeconds(handledArgs.since.split("/")[0])
        var perSeconds = tools.convert.stringToSeconds(handledArgs.since.split("/")[1])
        connection.query("INSERT INTO roleAwards (guildID, game, time, per, roleID) VALUES (?, ?, ?, ?, ?)", [message.guild.id, handledArgs.game, timeSeconds, perSeconds, role.id], function(error, results, fields) {
          var str = lang.commands.addRole.success.replace("%role%", role).replace("%neededTime%", tools.convert.secondsToTime(timeSeconds, true)).replace("%timePeriod%", tools.convert.secondsToTime(perSeconds, true))
          if(handledArgs.defaultGame) str += lang.commands.addRole.defaultGameNote
          return message.channel.send(str)
        })
      })
    } else {
      return message.reply(lang.errors.noPermission)
    }
}