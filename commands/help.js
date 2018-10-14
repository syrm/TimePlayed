const Discord = require("discord.js")
module.exports = function(obj) {
  var message = obj.message;
  var handledArgs = obj.handledArgs;
  var lang = obj.lang;
  var client = obj.client;
  var guildConf = obj.guildConf;
  var PM = message.channel.type == "dm"
  if(PM) {
    guildConf.prefix = "!!";
  }
  
  if(handledArgs.defaultGame) {
      var categories = {}
      Object.keys(lang.commands).forEach((commandName, index) => {
        var commandObj = lang.commands[commandName]
        if(!PM) {
          if(!categories[commandObj.category]) categories[commandObj.category] = []
          categories[commandObj.category].push({command: commandName, description: commandObj.helpDescription, args: commandObj.args})
        } else if(commandObj.PMSupport) {
          if(!categories[commandObj.category]) categories[commandObj.category] = []
          categories[commandObj.category].push({command: commandName, description: commandObj.helpDescription, args: commandObj.args.replace("[@user]", "")})
        }
      })
      const embed = new Discord.RichEmbed()
      .setAuthor(lang.commands.help.title, client.user.avatarURL)
      .setColor(lang.colors.lightGreen)
      if(PM) embed.setDescription(lang.commands.help.PMDescription)
      if(!PM) embed.setDescription(lang.commands.help.description)
      Object.keys(categories).forEach(category => {
        var commands = categories[category]
        var str = ""
        commands.forEach(command => {
          str += `**${guildConf.prefix}${command.command}** ${command.args} - ${command.description}\n`
        })
        embed.addField(category, str)
      })
      embed.addField(lang.commands.help.linksTitle, lang.commands.help.links)
      message.channel.send({embed})
    } else {
      var description;
      var aliases;
      var commandUpper;
      var syntax;
      Object.keys(lang.commands).forEach(commandName => {
        if(handledArgs.other == commandName.toLowerCase() || handledArgs.other.replace(guildConf.prefix, "").toLowerCase() == commandName.toLowerCase() || handledArgs.other.replace("!!", "").toLowerCase() == commandName.toLowerCase()) {
          var commandObj = lang.commands[commandName]
          description = commandObj.fullDescription;
          syntax = commandObj.args;
          commandUpper = commandName;
          aliases = commandObj.aliases
        }
      })
      var aliasesString;
      if(aliases && aliases.length > 0) {
        var is = "is"
        var es = ""
        if(aliases.length > 1) {
          is = "are"
          es = "es"
        } 
        var aliasesString = `The ${aliases.length} alias${es} for this command ${is}: `
        aliases.forEach((alias, i) => {
          var last = i == aliases.length - 1
          if(i == 0) {
            aliasesString += `\`${guildConf.prefix}${alias}\``
          } else if(last) {
            aliasesString += ` and \`${guildConf.prefix}${alias}\``
          } else {
            aliasesString += `, \`${guildConf.prefix}${alias}\``
          }
        })
      } else {
        aliasesString = `This command has no aliases!`
      }
      
      if(!description) return message.reply(lang.errors.helpCommandNotFound)

      const embed = new Discord.RichEmbed()
      .setAuthor("Command info")
      .setDescription(lang.commands.help.fullDescriptionDescription.replace("%command%", commandUpper))
      .setColor(lang.colors.lightGreen)
      .addField(`Aliases`, aliasesString)
      .addField(`Syntax`, lang.commands.help.syntax.replace("%syntax%", `${guildConf.prefix}${commandUpper} ${syntax}`))
      .addField(`Full description`, description)
      message.channel.send({embed})
    }
}