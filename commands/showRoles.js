const tools = require("../tools");
var connection = tools.getConnection;
module.exports = function(obj) {
  var message = obj.message;
  var guildConf = obj.guildConf;
  connection.query("SELECT * FROM roleAwards WHERE guildID=?", message.guild.id, function(error, results, fields ){
    var string = "";
    if(results.length < 1) {
      return message.reply(`This server has no auto roles awarded! To add one, please try the \`${guildConf.prefix}addRole\` command.`)
    } else if(results.length == 0) {
      string = `**There is one role award in this server:**\n`
    } else {
      string = `**There are ${results.length} role awards in this server:**\n`
    }
    results.forEach((award, i) => {
      var role = message.guild.roles.get(award.roleID)
      if(role) {
        string += `**${i + 1}:** Game: \`${award.game}\`, time needed: \`${tools.convert.secondsToTime(award.time, true)}/${tools.convert.secondsToTime(award.per, true)}\`, awarded role: ${role}\n`
      } else {
        string += `**${i + 1}:** \`(deleted role, please remove)\`\n`
      }
    })
    if(message.member.hasPermission("ADMINISTRATOR")) {
      string += `To manage these awards, try the \`${guildConf.prefix}addRole\` and \`${guildConf.prefix}removeRole\` command.`
    }
    return message.channel.send(string)
  })
  
}