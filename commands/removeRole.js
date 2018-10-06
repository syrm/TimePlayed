const tools = require("../tools");
var connection = tools.getConnection;
module.exports = function(obj) {
  var message = obj.message;
  var handledArgs = obj.handledArgs;
  var guildConf = obj.guildConf;
  var lang = obj.lang;

  var arg = [handledArgs.other];
  if(message.member.hasPermission("ADMINISTRATOR")) {
    if(arg[0] == undefined || isNaN(arg[0]) || Number(arg[0] - 1) > guildConf.roleAwards.length || Number(arg[0]) <= 0) {
      var string = `Which role would you like to remove? Please choose from the choices below and type \`${guildConf.prefix}removeRole (number)\` to remove that role.\n**Current role awards:**\n`
      if(guildConf.roleAwards.length < 1) {
        return message.reply(`This server doesn't have any role awards, so there's nothing to remove!`)
      }
      for(i = 0; i < guildConf.roleAwards.length; i++) {
        var role = message.guild.roles.get(guildConf.roleAwards[i].roleID)
        if(role) {
          string += `**${i + 1}:** Game: \`${guildConf.roleAwards[i].game}\`, time needed: \`${tools.convert.sinceToString(guildConf.roleAwards[i].time, true, true)}/${tools.convert.sinceToString(guildConf.roleAwards[i].per, true)}\`, awarded role: ${role}\n`
        } else {
          string += `**${i + 1}:** \`(deleted role, please remove)\`\n`
        }
      }
      return message.reply(string)
    } else {
      var role = guildConf.roleAwards[Number(arg[0] - 1)]
      var roleMention = message.guild.roles.get(role.roleID)
      guildConf.roleAwards.splice(Number(arg[0]) - 1, 1)
      connection.query("UPDATE guildSettings SET roleAwards=?", [JSON.stringify(guildConf.roleAwards)], function(error, results, fields) {
        return message.reply(`Succesfully removed the ${roleMention} role award when playing more than \`${tools.convert.sinceToString(role.time, true, true)}/${tools.convert.sinceToString(role.per, true)}\` \`${role.game}\``)
      })
    }
  } else {
    return message.reply(lang.errors.noPermission)
  }
}