module.exports = function(message, guildConf) {
  var string = ``
  var count = 0;
  for(i = 0; i < guildConf.roleAwards.length; i++) {  
    var role = message.guild.roles.get(guildConf.roleAwards[i].roleID)
    count++;
    var roleName;
    if(role) {
      string += `**${i + 1}:** Game: \`${guildConf.roleAwards[i].game}\`, time needed: \`${tools.convert.sinceToString(guildConf.roleAwards[i].time, true, true)}/${tools.convert.sinceToString(guildConf.roleAwards[i].per, true)}\`, awarded role: ${role}\n`
    } else {
      string += `**${i + 1}:** \`(deleted role, please remove)\`\n`
    }
  }
  if(count < 1) {
    return message.reply(`This server has no auto roles awarded! To add one, please try the \`${guildConf.prefix}addRole\` command.`)
  }
  if(count > 1) {
    string = `**There are ${count} role awards in this server:**\n` + string
  } else {
    string = `**There is one role award in this server:**\n` + string
  }
  
  if(message.member.hasPermission("ADMINISTRATOR")) {
    string += `To manage these awards, try the \`${guildConf.prefix}addRole\` and \`${guildConf.prefix}removeRole\` command.`
  }
  return message.channel.send(string)
}