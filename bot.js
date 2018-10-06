// Made by xVaql#4581, all rights reserved
const keys = require('./keys.json');
var beta;
if(keys.beta) {
  beta = true
} else {
  beta = false
}


var token = keys.botToken
const key = keys.imageAPIKeys;
var realityWarning = `Please realize that this information is **based on Discord presences** and it can deviate from reality.`

// Require everything
const Discord = require("discord.js")
const fs = require('fs');
const tools = require("./tools")
const en = require('./lang/en.json')
const DBL = require("dblapi.js")

const execute = require("./commands");

const client = new Discord.Client({disableEveryone: true, autoReconnect:true, fetchAllMembers: true});
const dbl = new DBL(keys.discordbotsToken, client);

var connection = require('./tools/connection.js');

function bulkReplaceLang(arr, msg) {
  var lang = msg;
  for(var key1 in lang) {
    for(var key2 in lang[key1]) {
      if(typeof lang[key1][key2] == "object") {
        for(var key3 in lang[key1][key2]) {
          if(typeof lang[key1][key2][key3] == "string") {
            arr.forEach(e => {
              var regex = new RegExp(e[0], "g")
              lang[key1][key2][key3] = lang[key1][key2][key3].replace(regex, e[1])
            })
          } 
        }
      } else if(typeof lang[key1][key2] == "string") {
        arr.forEach(e => {
          var regex = new RegExp(e[0], "g")
          lang[key1][key2] = lang[key1][key2].replace(regex, e[1])
        })
      }
    }
  }
  return lang;
}

function wrongSyntax(message, command, lang) {
  var rightArgs;
  var commandName;
  var fullDescription
  Object.keys(lang.commands).forEach(key => {
    var commandObj = lang.commands[key]
    if(key.toLowerCase() == command) {
      commandName = key;
      rightArgs = commandObj.args
      fullDescription = commandObj.fullDescription
    }
  })
  const embed = new Discord.RichEmbed()
  .setAuthor("Wrong syntax!")
  .setColor(lang.colors.lightGreen)
  .setDescription("It seems like you're using the syntax of this command wrong or you're missing required arguments. Here's some information to help you.")
  .addField("The right syntax of this command is:", `\`${lang.vars.prefix}${commandName} ${rightArgs}\``)
  .addField("The full description of this command is:", fullDescription)
  return message.channel.send({embed})
}

function log(message) {
  if(beta) return;
  var logChannel = client.channels.get("462909240298962944")
  logChannel.send(`\`${message}\``)
  return message;
}

function postStats() {
  if(!beta) {
    dbl.postStats(client.guilds.size)
      .then(err => console.log("Stats posted!"))
      .catch(err => console.log("Error posting stats"));
  }
}


var commands = []
var playtimeCommands = []
var aliases = {}
Object.keys(en.commands).forEach(command => {
  var commandObj = en.commands[command]
  commands.push(command.toLowerCase())
  if(commandObj.playtimeCommand) playtimeCommands.push(command.toLowerCase())
  aliases[command.toLowerCase()] = commandObj.aliases
})
client.on("ready", () => {
  client.user.setActivity(`${client.users.size} users | !!help`, { type: 'WATCHING' });
  log("Bot is ready")
  console.log(`Bot is ready!`);
  console.log(`I'm in ${client.guilds.size} guilds.`)
  postStats()
  setInterval(postStats, 1800000);
  setInterval(() => {
    client.user.setActivity(`${client.users.size} users | !!help`, { type: 'WATCHING' });
  }, 60000)
  var count = 0;
  if(beta) return;
  connection.query("SELECT * FROM acceptMessages", function(error, results, fields) {
    if(error) throw error;
    results.forEach(result => {
      var channel = client.channels.get(result.channelID)
      channel.fetchMessage(result.messageID).then(msg => {
        if(!msg) {
          connection.query("DELETE FROM acceptMessages WHERE messageID=?", [result.messageID], function(error, results, fields) {
          })
          return;
        }
        tools.acceptCollector(msg)
      }).catch(msg => {
        connection.query("DELETE FROM acceptMessages WHERE messageID=?", [result.messageID], function(error, results, fields) {
        })
      })
    })
    console.log("Fully started up!")
    log("Fully started up")
  })
});

client.on("guildCreate", guild => {
  client.user.setActivity(`${client.users.size} users | !!help`, { type: 'WATCHING' });
  var found = false;
  tools.getGuildConfig(guild.id, function(guildConf) {
    guild.channels.forEach(function(channel, id) {
        if(found || channel.type != "text") return;
        if(guild.me.permissionsIn(channel).has("SEND_MESSAGES") && guild.me.permissionsIn(channel).has("VIEW_CHANNEL")) {
          found = true;
          return channel.send(`**Hi there! Thanks for inviting me to your server!**\nThere are a few things you need to know about me:\n- Type \`${guildConf.prefix}help\` to get a list of my commands\n- My default prefix is \`${guildConf.prefix}\`, but it can be changed with \`${guildConf.prefix}setConfig prefix (newPrefix)\`\n- To get to know more about me, take a look at my website (<https://timeplayed.xyz>)\n- If you come across any trouble you can always join the support server (<http://support.timeplayed.xyz>)\n- Your playtime is **based on Discord presences**, so if your Discord is closed or your game status is disabled I will not be able to log your playtime and information may become inaccurate\n- The bot starts measuring everyone in this server's playtime from now on, so please give give it some time and don't instantly kick it if it's not working as expected\n**Greetings!**`)
        }
    })
  })

  console.log(`${Date()}: Joined new guild: ${guild.name}, sent welcome message: ${found}`)
  log(`Joined a new server (current server count: ${client.guilds.size})`)
  postStats()
});
client.on("guildDelete", guild => {
  client.user.setActivity(`${client.users.size} users | !!help`, { type: 'WATCHING' });
  log(`Left a server (current server count: ${client.guilds.size})`)
  console.log(`${Date()}: Left guild: ${guild.name}`)
  postStats()
})

client.on("message", message => {
  if(message.author.bot) return;
  var lang = JSON.parse(JSON.stringify(en));
  if(message.channel.type == "group") return message.reply(lang.errors.noGroupPM)
  var guildID;
  var guildName;
  var PM = message.channel.type == "dm"
  if(PM) {
    guildID = "pm"
    guildName = "pm"
  } else {
    guildID = message.guild.id
    guildName = message.guild.name
  }
  tools.getGuildConfig(guildID, function(guildConf) {
    var contentCMD;
    if(message.content.startsWith(`<@${client.user.id}>`)) {
      contentCMD = message.content.replace(/  +/g, ' ').replace(`<@${client.user.id}>`, "").split(/ +/g)[1]
      arg = message.content.replace(/  +/g, ' ').split(/ +/g).slice(2)
    } else if(PM && !message.content.startsWith("!!")) {
      contentCMD = message.content.replace(/  +/g, ' ').split(/ +/g)[0]
      arg = message.content.replace(/  +/g, ' ').split(/ +/g).slice(1)
    } else {
      contentCMD = message.content.replace(/  +/g, ' ').replace(guildConf.prefix, "").split(/ +/g)[0];
      arg = message.content.replace(/  +/g, ' ').split(/ +/g).slice(1)
    }

    // Delete rankingChannel messages
    if(`<#${message.channel.id}>` == guildConf.rankingChannel) return message.delete()

    // Check for restart command (can only be ran by me)
    if(message.content == "!!restart" && message.author.id == "112237401681727488") {
        console.log("Restarting...")
        log("Restarting the bot due to updates/maintenance...")
        message.reply("Restarting the bot...").then(() => {
          process.exit()
        })
    }

    if(message.content.startsWith("!!query") && message.author.id == "112237401681727488") {
      return message.channel.send("<a:loading:455383347921682433> Executing query").then((msg) => {
        connection.query(message.content.replace("!!query", ""), function(error, results, fields) {
          if(error) {
            msg.edit(`MySQL has returned an error:\n\`${error}\``);
          } else {
            msg.edit(`Here are your results:\n\`${JSON.stringify(results)}\``).catch(function(error) {
                msg.edit(`Query results too long, can't send them here`);
              })
          }
        })
      })
    }

    // Check if message is a command
    
    // Convert aliases to a regular command
    var found = false;
    var command;
    var counter = 0;
    Object.values(aliases).forEach(value => {
      for(var i = 0; i < value.length; i++) {
        if(contentCMD && contentCMD.toLowerCase() == value[i]) {
          found = true;
          command = Object.keys(aliases)[counter]
        }
      }
      counter ++;
    })
    if(!found && contentCMD) command = contentCMD.toLowerCase();

    // Return if the command doesn't start with the guild prefix

    if(message.content.startsWith(guildConf.prefix) == false) {
      if(message.content.startsWith(`<@${client.user.id}>`) && commands.indexOf(command) == -1) {
        return message.reply(`Hi there! Do you need me? If you do, please type \`${guildConf.prefix}help\` to get a list of all my commands.`)
      }
      if(message.content.startsWith("!!")) {
        if(commands.indexOf(message.content.replace("!!", "").split(/ +/g)[0].toLowerCase()) != -1) {
          return message.reply(`Are you trying to run one of my commands? If you are, please run \`${guildConf.prefix}${message.content.replace("!!", "")}\` instead, as this servers prefix is \`${guildConf.prefix}\``)
        }
      } else if(guildConf.prefix == "!" && message.content.startsWith("!!")) {
        if(commands.indexOf(message.content.replace("!!", "").split(/ +/g)[0].toLowerCase()) != -1) {
          return message.reply(`Are you trying to run one of my commands? If you are, please run \`${guildConf.prefix}${message.content.replace("!!", "")}\` instead, as this servers prefix is \`${guildConf.prefix}\``)
        }
      }
      if(!PM && !message.content.startsWith(`<@${client.user.id}>`)) return;
    }

    // Return if the command (alias already converted) isn't a command in the list of commands
    if(commands.indexOf(command) == -1 && PM) return message.reply("Hello there! If you need me, please type `!!help` for a list of all my commands!")
    if(commands.indexOf(command) == -1) return;



    // From this point, I assume the user is running a command

    // First handle all the args with the command handler/define the mention with it
    var handledArgs = tools.commandHandler(arg, guildConf.defaultGame, command)
    var mentionID;
    if(handledArgs.mention) mentionID = handledArgs.mention.replace(/[<@!>]+/g, "")
    var mention = client.users.get(mentionID)
    if(mentionID == message.author.id) {mentionID = undefined; mention = undefined;}
    if(mentionID && !mention) return message.reply(lang.errors.mentionNotFound)
    // Set the right forms of language to spare code lines
    var toBe = "are"
    var toHave = "have"
    var person = "you"
    var possessive = "your"
    if(mention) {
      toBe = "is"
      toHave = "has"
      person = mention.username
      if(mention.username.endsWith("s"))
      possessive = `${mention.username}'s`
      // If there is a mention, the possessive's first letter shouldn't be an upper case
      lang = tools.replaceLang(/%possessiveUpper%+/g, `${mention.username}'s`, lang)
      lang = tools.replaceLang(/%personUpper%+/g, mention.username, lang)
    } else {
      // If there is no mention, the possessive/persons first letter should be an upper case
      lang = tools.replaceLang(/%possessiveUpper%+/g, "Your", lang)
      lang = tools.replaceLang(/%personUpper%+/g, "You", lang)
    }
    
    lang = bulkReplaceLang([["%be%", toBe], ["%have%", toHave], ["%person%", person], ["%possessive%", possessive], ["%prefix%", guildConf.prefix]], lang)
    if(command != "timeplayed") lang = tools.replaceLang(/%game%+/g, handledArgs.other, lang)
    if(handledArgs.game) lang = tools.replaceLang(/%game%+/g, handledArgs.game, lang) 

    var result;
    Object.keys(lang.commands).forEach(commandName => {
      if(commandName.toLowerCase() == command) result = commandName
    })
    if(PM && commands.indexOf(command) != -1 && !lang.commands[result].PMSupport) return message.channel.send(lang.errors.noPMCommand)

    // If command is ran but bot has no perms to speak, send the author an error PM
    if(message.channel.type == "text" && commands.indexOf(command) != -1 && message.guild.me.permissionsIn(message.channel).has("SEND_MESSAGES") == false) {
      return message.author.send(lang.errors.noSpeakPerms.replace("%message.content%", message.content).replace("%message.guild.name%", guildName)).catch(err => console.log(`Error sending no permission message: ${err}`))
    }

    // Log the command
    console.log(`${new Date()}: User: ${message.author.tag}, Command: ${message.content}, guild: ${guildName}`)

    // Return an error if a bot is mentioned and the user ran a playtime command
    if(playtimeCommands.indexOf(command) != -1 && mention && mention.bot) return message.reply(lang.errors.noBots)

    // Return if date is more than 2 digit number
    if(handledArgs.since == -1) return message.reply(lang.errors.tooMuchSince)

    // Assign the right ID, and check for unsupported PM mentions
    var id = message.author.id
    var meantUser = message.author
    if(mention) {id = mention.id; meantUser = mention}
    if(PM && mention) return message.reply(lang.errors.noPMMention)

    // Define the standard sinces
    var defaultSinces = ['7d', 'today', undefined]
    var game = handledArgs.other
    var customSince = handledArgs.since
    // Execute the private check (async)
    tools.termsCheck(message.author.id, mentionID, guildID, function(results) {
      accept = results[0]
      premium = results[1]
      tools.privateCheck(mentionID, guildID, function(private) {
        var termsMSG;
        if(accept.executer == undefined && command != "accept") termsMSG = lang.errors.firstTime;
        if(accept.executer == false && command != "accept") termsMSG = lang.errors.stillAccept;
        var reactPerms = false;
        if(message.guild && message.guild.me.permissionsIn(message.channel).has("ADD_REACTIONS")) reactPerms = true;
        var methodMessage = lang.errors.commandMessage
        if(reactPerms) methodMessage = lang.errors.reactionMessage
        if(termsMSG) return message.channel.send(termsMSG + methodMessage + lang.errors.acceptMessageSuffix).then(msg => {
          if(!reactPerms) return;
          tools.awaitReaction(msg, ["✅"], undefined, function(emoji, index, user) {
            tools.setTerms(user.id, true, function() {
              return message.channel.send(`<@${user.id}>, ${lang.general.termsAccepted}`)
            })
          })
        })

        if(mention && !accept.mention && playtimeCommands.indexOf(command) != -1) return message.reply(lang.errors.mentionNoAccept)
        if(mention && private && playtimeCommands.indexOf(command) != -1) return message.reply(lang.errors.privateMention)
    
        // If syntax of command is wrong, return and reply a message
        if(handledArgs.wrongSyntax) return wrongSyntax(message, command, lang)
    
        // Get the start date of the user
        tools.getStartDate(id, function(startDate) {
          
          lang = tools.replaceLang(/%startDateString%+/g, tools.convert.timeDifference(startDate, new Date(), true), lang)
            if(command === "servertop") {
              
            }
            if(command === "topplayed") {
              execute.topPlayed(message, handledArgs, id, mention, lang);
            }
            if(command === "timeplayed") {
              execute.timePlayed(message, handledArgs, id, mention, lang);
            }
            if(command === "lastplayed") {
              tools.lastPlayed(id, handledArgs.other, function(result) {
                if(result == -1) return msg.edit(lang.commands.timePlayed.noPlaytime)
                if(meantUser.presence.game && meantUser.presence.game.name.toLowerCase() == handledArgs.other.toLowerCase()) return msg.edit(lang.commands.lastPlayed.rightNow)
                return msg.edit(lang.commands.lastPlayed.message.replace("%result%", tools.convert.timeDifference(result)))
              })
            }

            if(command === "help")  {
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
                var commandWithUpper;
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
    
            if(command === "playing") {
              execute.playing(message, handledArgs, lang);
            }
    
            if(command === "botinfo") {
              execute.botInfo(message, client, lang);
            }
    
            if(command === "invite") {
              message.channel.send(lang.commands.invite.msg)
            }
    
            if(command === "status") {
              execute.status(message, client, id, mention, lang);
            }
    
            if(command === "removegame") {
              if(handledArgs.defaultGame) return wrongSyntax(message, command, lang)
              execute.removeGame(message, handledArgs)
            }
    
            if(command === "setprivacy") {
              message.channel.send(lang.commands.setPrivacy.choices).then(msg => {
                tools.awaitReaction(msg, ["🇦", "🇧", "🇨"], message.author.id, function(reaction, choice) {
                  tools.setPrivacy(message.author.id, message.guild.id, choice, function(success) {
                    if(choice == 0) return message.reply(lang.commands.setPrivacy.localPrivate)
                    if(choice == 1) return message.reply(lang.commands.setPrivacy.globalPrivate)
                    if(choice == 2) return message.reply(lang.commands.setPrivacy.globalPublic)
                  })
                })
              })
            }
            
            if(command === "accept") {
              tools.setTerms(message.author.id, true, function() {
                return message.reply(lang.general.termsAccepted)
              })
            }
    
            if(command === "erase") {
              message.reply(lang.commands.erase.confirmation).then(msg => {
                tools.awaitReaction(msg, ["✅"], message.author.id, function() {
                  message.channel.send("<a:loading:455383347921682433> Deleting your playtime data...").then(loadingMSG => {
                    tools.setTerms(message.author.id, false, function() {
                      connection.query(`DELETE FROM playtime WHERE userID=${message.author.id}`, function(error, results, fields) {
                        loadingMSG.edit("<a:loading:455383347921682433> Deleting your last online data...")
                        connection.query(`DELETE FROM lastOnline WHERE userID=${message.author.id}`, function(error, results, fields) {
                          loadingMSG.edit("<a:loading:455383347921682433> Deleting your start date...")
                          connection.query(`DELETE FROM startDates WHERE userID=${message.author.id}`, function(error, results, fields) {
                            loadingMSG.edit("Done! All your data is now completely erased.")
                          })
                        })
                      })
                    })
                  })
                })
              })
            }
    
            if(command === "setconfig") {
              execute.setConfig(message, handledArgs, lang)
            }
    
            if(command === "showconfig") {
              execute.showConfig(message, guildConf, lang)
            }
    
            if(command === "addrole") {
              execute.addRole(message, handledArgs, guildConf, lang)
            }
    
            if(command === "removerole") {
              execute.removeRole(message, handledArgs, guildConf, lang)
            }
    
            if(command === "showroles") {
              execute.showRoles(message, guildConf)
            }
          
        })
      })
      

    })
  });
  

})

client.login(token).catch(err => console.log(err))