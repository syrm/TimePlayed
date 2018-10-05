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

const client = new Discord.Client({disableEveryone: true, autoReconnect:true, fetchAllMembers: true});
const dbl = new DBL(keys.discordbotsToken, client);

var connection = require('./tools/connection.js');

function requestIcon(game, requesterID, requesterTag) {
  connection.query("SELECT * FROM gameIcons WHERE game=?", [game], function(error, results, fields) {
    var error = false;
    results.forEach(result => {
      if(result.game.toLowerCase() == game.toLowerCase()) {
        error = true;
        return;
      }
    })
    if(error) return;
    connection.query(`INSERT INTO gameIcons (game, userID) VALUES (?, ?)`, [game, requesterID], function(error, results, fields) {
      client.channels.get("475001642870374410").send(`Icon requested, status: awaiting response\nGame name: \`${game}\`\nRequested by: \`${requesterTag}\`\nType \`!assign ${results.insertId} (iconURL)\` to approve, or \`!delete ${results.insertId}\` to delete/ignore.`).then(msg => {
        connection.query("UPDATE gameIcons SET messageID=? WHERE ID=?", [msg.id, results.insertId], function(error, results, fields) {
          return;
        })
      })
    })
  })
}

function getThumbnail(game, callback) {
  if(!game || game == "") return callback(undefined);
  connection.query("SELECT * FROM gameIcons WHERE game=? AND blocked IS NOT NULL", [game], function(error, results, fields) {
    if(results.length > 0) {
      return callback(results[0].iconURL)
    } else {
      callback(undefined)
      return requestIcon(game, undefined, "Client (automated request)")
    }
  })
}

function getRole(string, guildID) {
  if(string == undefined) return undefined;
  var guild = client.guilds.get(guildID);
  var roleID = string.replace("<@", "").replace(">", "");
  if(guild.roles.get(roleID) != undefined) return message.guild.roles.get(roleID);
  if(guild.roles.find("name", string) != undefined) return guild.roles.find("name", string);
  // If nothing was found, return undefined
  return undefined;
}

async function awaitReaction(msg, emojis, userID, callback) {
  for(i = 0; i < emojis.length; i++) {
    await msg.react(emojis[i]).catch(err => console.log("No permission to add reaction"))
  }
  const filter = (reaction, user) => emojis.includes(reaction.emoji.toString()) && user.id != client.user.id
  const collector = msg.createReactionCollector(filter);
  collector.on('collect', (reaction, user) => {
    user = reaction.users.last()
    if(userID && user.id != userID) return;
    callback(reaction.emoji, emojis.indexOf(reaction.emoji.toString()), user)
    collector.stop()
  })
}

function replaceLang(toReplace, replaceValue, msg) {
  var lang = msg;
  for(var key1 in lang) {
    for(var key2 in lang[key1]) {
      if(typeof lang[key1][key2] == "object") {
        for(var key3 in lang[key1][key2]) {
          if(typeof lang[key1][key2][key3] == "string") {
            lang[key1][key2][key3] = lang[key1][key2][key3].replace(toReplace, replaceValue)
          } 
        }
      } else if(typeof lang[key1][key2] == "string") {
        lang[key1][key2] = lang[key1][key2].replace(toReplace, replaceValue)
      }
    }
  }
  return lang;
}

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

function acceptCollector(acceptMessage) {
  const filter = (reaction, user) => reaction.emoji.toString() == "✅" && reaction.message.content.startsWith("​​​​") && reaction.message.author.id == client.user.id && user.id != client.user.id
  const collector = acceptMessage.createReactionCollector(filter);
  collector.on('collect', (reaction, user) => {
    user = reaction.users.last()
    var lang = JSON.parse(JSON.stringify(en));
    tools.setTerms(user.id, true, function() {
      reaction.message.channel.send(`<@${user.id}> Success!`).then(msg => {msg.delete(2000)})
    })
  })
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
        acceptCollector(msg)
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
      lang = replaceLang(/%possessiveUpper%+/g, `${mention.username}'s`, lang)
      lang = replaceLang(/%personUpper%+/g, mention.username, lang)
    } else {
      // If there is no mention, the possessive/persons first letter should be an upper case
      lang = replaceLang(/%possessiveUpper%+/g, "Your", lang)
      lang = replaceLang(/%personUpper%+/g, "You", lang)
    }
    
    lang = bulkReplaceLang([["%be%", toBe], ["%have%", toHave], ["%person%", person], ["%possessive%", possessive], ["%prefix%", guildConf.prefix]], lang)
    if(command != "timeplayed") lang = replaceLang(/%game%+/g, handledArgs.other, lang)
    if(handledArgs.game) lang = replaceLang(/%game%+/g, handledArgs.game, lang) 

    var result;
    Object.keys(lang.commands).forEach(commandName => {
      if(commandName.toLowerCase() == command) result = commandName
    })
    if(PM && commands.indexOf(command) != -1 && !lang.commands[result].PMSupport) return message.channel.send(lang.errors.noPMCommand)

    // If command is ran but bot has no perms to speak, send the author an error PM
    if(message.channel.type == "text" && commands.indexOf(command) != -1 && message.guild.me.permissionsIn(message.channel).has("SEND_MESSAGES") == false) {
      return message.author.send(lang.errors.noSpeakPerms.replace("%message.content%", message.content).replace("%message.guild.name%", guildName)).catch(err => console.log(`Error sending no permission message: ${err}`))
    }

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
          awaitReaction(msg, ["✅"], undefined, function(emoji, index, user) {
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
          var sinceWarning = false;
          if(handledArgs.since && tools.convert.sinceDate(handledArgs.since) < startDate) sinceWarning = true;
          lang = replaceLang(/%startDateString%+/g, tools.convert.timeDifference(startDate, new Date(), true), lang)
          if(playtimeCommands.indexOf(command) != -1) {
            message.channel.send('<a:loading:455383347921682433>').then(msg => {
              if(command === "servertop") {
                tools.timePlayed(id, guildConf.defaultGame, defaultSinces, function(results) {
                  // Check if there is actually a ranking channel in the server and if the server has premium
                  if(premium == false) return msg.edit(lang.errors.premiumOnly)
                  if(!guildConf.rankingChannel || guildConf.rankingChannel == "none") return msg.edit(lang.errors.noRankingChannel)
                  if(fs.existsSync(`./data/cache/${message.guild.id}`)) {
                    function getPlace(since) {
                      return tools.convert.ordinalSuffix(JSON.parse(fs.readFileSync(`./data/cache/${message.guild.id}/${since}.json`)).map(e => e.id).indexOf(id) + 1)
                    }
                    // Replace all the variables in the message file
                    var times = [["weekly", "Week"], ["daily", "Day"], ["always", "All"]]
                    times.forEach(time => {
                      lang = replaceLang(`%place${time[1]}%`, getPlace(time[0]), lang)
                    })
                    times = [["weekly", "Week"], ["daily", "Day"], ["always", "All"]]
                    times.forEach(place => {
                      lang = replaceLang(`%place${place[1]}%`, getPlace(place[0]), lang)
                    })
                    times = [["7d", "Week"], ["today", "Day"], [undefined, "All"]]
                    times.forEach(since => {
                      lang = replaceLang(`%timePlayed${since[1]}%`, tools.convert.timeToString(results[since[0]]), lang)
                    })
                    if(results[undefined] == 0) {
                      return msg.edit(lang.commands.serverTop.noPlaytime)
                    }
                    const embed = new Discord.RichEmbed()
                    .setAuthor(lang.commands.serverTop.title, meantUser.avatarURL)
                    .setColor(0x00AE86)
                    .setDescription(realityWarning)
                    .setFooter(lang.commands.serverTop.footer.replace("%updatedAt%", fs.readFileSync(`./data/cache/${message.guild.id}/date.txt`)))
                    .setThumbnail(getThumbnail(game))
                    .setDescription(lang.commands.serverTop.checkRankingChannel.replace("%amount%", guildConf.leaderboardAmount).replace("%rankingChannel%", guildConf.rankingChannel))
                    if(results["7d"] == 0) {
                      embed.addField(lang.commands.serverTop.weekTitle, lang.commands.serverTop.noWeekly)
                    } else {
                      embed.addField(lang.commands.serverTop.weekTitle, lang.commands.serverTop.weekly)
                    }
                    if(results["today"] == 0) {
                      embed.addField(lang.commands.serverTop.dayTitle, lang.commands.serverTop.noDaily)
                    } else {
                      embed.addField(lang.commands.serverTop.dayTitle, lang.commands.serverTop.daily)
                    }
                    embed.addField(lang.commands.serverTop.allTitle, lang.commands.serverTop.all)
                    msg.edit({embed});
                  } else {
                    return msg.edit(lang.errors.noLeaderboardFile)
                  }
                })
              }
              if(command === "topplayed") {
                if(handledArgs.other && !handledArgs.defaultGame) return msg.edit(lang.commands.topPlayed.noGame.replace("%arg%", handledArgs.other))
                var customSince = tools.convert.sinceDate(handledArgs.since, true)
                tools.topGames(id, handledArgs.since, function(topGames, totalMS) {
                  if(topGames.length < 1 || topGames.every(e => e.time < 1)) {
                    if(handledArgs.since) {
                      return msg.edit(lang.commands.topPlayed.noGamePeriod)
                    } else {
                      return msg.edit(lang.commands.topPlayed.noGameEver)
                    }
                  }
                  const embed = new Discord.RichEmbed()
                    .setColor("#33f76b")
                    lang = replaceLang(/(?:\r\n|\r|\n)/g, "", lang)
                    if(sinceWarning) {
                      embed.setDescription(`- ${lang.warnings.sinceWarning}\n - ${lang.warnings.realityWarning}`)
                    } else if(!handledArgs.since) {
                      embed.setDescription(`- ${lang.commands.topPlayed.measuredSince}\n - ${lang.warnings.realityWarning}`)
                    } else {
                      embed.setDescription(lang.warnings.realityWarning)
                    }
                    var hours = Math.floor(totalMS / 3600000)
                    if(hours < 1) hours = "< 1"
                    lang = replaceLang("%hours%", hours, lang)
                    if(handledArgs.since) {
                      embed.setTitle(lang.commands.topPlayed.titleCustomSince2.replace("%customSince%", tools.convert.sinceToString(handledArgs.since)), meantUser.avatarURL)
                    } else {
                      embed.setTitle(lang.commands.topPlayed.title2, meantUser.avatarURL)
                    }
                  for(var i = 0; i < 10; i++) {
                    if(topGames[i] && topGames[i].time / 1000 > 0) {
                      embed.addField(`${i + 1}. ${topGames[i].game}`, tools.convert.timeToString(topGames[i].time))
                    }
                  }
                  return msg.edit(embed)
                })
              }
              if(command === "timeplayed") {
                connection.query("SELECT game FROM playtime WHERE userID=? AND soundex(game) = soundex(?)", [id, handledArgs.other], function(error, correctedGames, fields) {
                  if(correctedGames.length < 1) return msg.edit(lang.commands.timePlayed.noPlaytime.replace("%game%", handledArgs.other) + lang.warnings.realityWarning)
                  var correctedGame = correctedGames[0].game
                  correctedGames.forEach(obj => {
                    if(obj.game.toLowerCase() == handledArgs.other.toLowerCase()) {
                      correctedGame = obj.game
                    }
                  })
                  handledArgs.other = correctedGame;
                  lang = replaceLang(/%game%+/g, handledArgs.other, lang)
                  var sinces = []
                  if(!handledArgs.since) {
                    sinces = defaultSinces
                  } else {
                    sinces.push(handledArgs.since)
                  }
                  tools.timePlayed(id, handledArgs.other, sinces, function(results) {
                    times = [["7d", "Week"], ["today", "Day"], [undefined, "All"], [handledArgs.since, "Custom"]]
                    times.forEach(since => {
                      lang = replaceLang(`%timePlayed${since[1]}%`, tools.convert.timeToString(results[since[0]]), lang)
                    })
                    if(handledArgs.since) {
                      var string = lang.commands.timePlayed.customSince.replace("%customSince%", tools.convert.sinceToString(handledArgs.since))
                      if(sinceWarning == true) {
                        string += lang.warnings.sinceWarning
                      }
                      return msg.edit(string)
                    }
                    const embed = new Discord.RichEmbed()
                    .setColor(3447003)
                    .setDescription(realityWarning)
                    .setFooter(lang.commands.timePlayed.footer)
                    if(startDate > tools.convert.sinceDate("week")) {
                      embed.addField(lang.commands.timePlayed.weekTitle, lang.commands.timePlayed.weekNoInfo)
                    } else {
                      embed.addField(lang.commands.timePlayed.weekTitle, lang.commands.timePlayed.week)
                    }
                    if(startDate > tools.convert.sinceDate("today")) {
                      embed.addField(lang.commands.timePlayed.dayTitle, lang.commands.timePlayed.dayNoInfo)
                    } else {
                      embed.addField(lang.commands.timePlayed.dayTitle, lang.commands.timePlayed.day)
                    }
                    embed.addField(lang.commands.timePlayed.allTitle, lang.commands.timePlayed.all)
                    if(mention) {
                      embed.setAuthor(lang.commands.timePlayed.title, mention.avatarURL)
                    } else {
                      embed.setAuthor(lang.commands.timePlayed.title, message.author.avatarURL)
                    }
                    getThumbnail(handledArgs.other, function(url) {
                      embed.setThumbnail(url)
                      msg.edit({embed});
                    })
                  })
                })
              }
              if(command === "lastplayed") {
                tools.lastPlayed(id, handledArgs.other, function(result) {
                  if(result == -1) return msg.edit(lang.commands.timePlayed.noPlaytime)
                  if(meantUser.presence.game && meantUser.presence.game.name.toLowerCase() == handledArgs.other.toLowerCase()) return msg.edit(lang.commands.lastPlayed.rightNow)
                  return msg.edit(lang.commands.lastPlayed.message.replace("%result%", tools.convert.timeDifference(result)))
                })
              }
            })
          } else {
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
              var userArray = [];
              var stringCount = 0;
              var realCount = 0;
              var string = "";
              var morePeople = false;
    
              message.guild.members.forEach(function(user, id) {
                if(!user.presence.game || !user.presence.game.name) return;
                if(stringCount >= 20) {
                  if(user.presence.game.name.toLowerCase() == handledArgs.other.toLowerCase()) {
                    realCount ++;
                  }
                  morePeople = true;
                  return;
                }
                if(user.presence.game.name.toLowerCase() == handledArgs.other.toLowerCase()) {
                  string += `- ${user.user.tag}\n`
                  realCount ++;
                  stringCount ++;
                }
              })
    
              if(stringCount == 0) string = lang.commands.playing.noOne;
              if(stringCount == 1) string = lang.commands.playing.one + string;
              if(stringCount > 1) {
                string = lang.commands.playing.more.replace("%count%", stringCount) + string;
              }
              if(morePeople == true) {
                string += lang.commands.playing.moreThanTwenty.replace("%more%", realCount - stringCount)
              }
              string += `\n${realityWarning}`;
              message.channel.send(string);
            }
    
            if(command === "botinfo") {
              const embed = new Discord.RichEmbed()
                .setAuthor(`Bot info`, ``)
                .setThumbnail(client.user.avatarURL)
                .addField(`Users`, `I'm currently handling \`${client.users.size}\` users`, true)
                .addField(`Guilds`, `I'm in \`${client.guilds.size}\` servers`, true)
                if(!PM) embed.addField(`Joined at`, `I joined this server at \`${message.guild.joinedAt}\``, true)
                embed.addField(`Last restart`, `My last restart was at \`${client.readyAt}\``, true)
                embed.addField(`Ping`, `My response time to you is: \`measuring...\``)
                embed.addField(`Creator`, `I was created by <@112237401681727488> (@xVaql#4581)`, true)
                embed.addField(`Useful links`, lang.commands.help.links)  
              return message.channel.send(embed).then(msg => {
                var num = 3;
                if(!PM) num = 4
                embed.fields[num].value = embed.fields[num].value.replace("measuring...", `${msg.createdAt.getTime() - message.createdAt.getTime()}ms`)
                msg.edit(embed)
              })
            }
    
            if(command === "invite") {
              message.channel.send(lang.commands.invite.msg)
            }
    
            if(command === "status") {
              var presences = {
                dnd: ["do not disturb<:dnd:455385674749575168>", "#db2525"],
                idle: ["idle<:idle:455385674665951234>", "#e29b16"],
                online: ["online<:online:455385674762158110>", "0x00AE86"],
                offline: ["offline/invisible<:offline:455385675076730900>", "#8c8c8c"]
              }
              var types = ["playing", "streaming", "listening to", "watching"];
              
              var gameMessage;
              var game = ""
              if(!meantUser.presence.game) {
                gameMessage = lang.commands.status.noGame
              } else {
                lang = replaceLang("%type%", types[meantUser.presence.game.type], lang);
                gameMessage = lang.commands.status.gamePlaying
                game = meantUser.presence.game.name;
              }
              
              var presence = presences[meantUser.presence.status][0]
              var embedColor = presences[meantUser.presence.status][1]
              
              function lastOnline(id, presence, callback) {
                if(presence.status != "offline") return callback("Right Now")
                  connection.query(`SELECT * FROM lastOnline WHERE userID=${id}`, function(error, results, fields) {
                    if(!results[0]) return callback("Not measured / Online since I got here", undefined);
                    return callback(tools.convert.firstLetterUp(tools.convert.timeDifference(results[0].date, new Date())) + " (see footer for excact timestamp)", results[0].date)
                  })
              }

              const embed = new Discord.RichEmbed()
              .setAuthor(lang.commands.status.title, client.user.avatarURL)
              .setColor(embedColor)
              .setDescription(realityWarning)
              .addField("Presence", lang.commands.status.presence.replace("%presence%", presence))
              if(meantUser.presence.game && meantUser.presence.game.details) {
                embed.setThumbnail(`https://cdn.discordapp.com/app-assets/${meantUser.presence.game.applicationID}/${meantUser.presence.game.assets.largeImage}.png`)
                embed.addField("Game playing", `${gameMessage}:\n**${meantUser.presence.game.name}**\n${meantUser.presence.game.details}\n${meantUser.presence.game.state}`)
              } else {
                embed.addField("Game playing", `${gameMessage} **${game}**`)
              }
              lastOnline(id, meantUser.presence, function(string, date) {
                if(meantUser.bot) game = undefined;
                getThumbnail(game, function(thumbnail) {
                  if(thumbnail && !embed.thumbnail) {
                    embed.setThumbnail(thumbnail);
                  } else if(!embed.thumbnail) {
                    embed.setThumbnail(meantUser.avatarURL);
                  } else if(game == "Spotify") {
                    embed.setThumbnail(thumbnail);
                  }
                  embed.addField("Last Online", string)
                  if(date) {
                    embed.timestamp = date;
                    embed.setFooter("Last online:")
                  }
                  message.channel.send({embed});
                })
                
              })
            }
    
            if(command === "removegame") {
              if(handledArgs.defaultGame) return wrongSyntax(message, command, lang)
              connection.query("SELECT * FROM playtime WHERE userID=? AND game=?", [message.author.id, handledArgs.other], function(err, results, fields) {
                if(!results || results.length < 1) return message.reply(`You have never played \`${handledArgs.other}\`, so there's nothing to remove!\nIf you keep getting this error, please run the \`${guildConf.prefix}topPlayed\` command, and copy and paste the game's name to double check your spelling.`)
                message.channel.send(`Are you sure? This will delete **all** your \`${handledArgs.other}\` playtime data.\n⚠️This action can **not** be undone!⚠️\nTo confirm this action, react with the ✅ emoji.\nReact with ❌ to cancel this action`)
                .then(msg => {
                  awaitReaction(msg, ["✅", "❌"], message.author.id, function(reaction, choice) {
                    if(choice == 1) return message.reply("Cancelled succesfully!")
                    connection.query("DELETE FROM playtime WHERE userID=? AND game=?", [message.author.id, handledArgs.other], function(err, results, fields) {
                      if(err) return message.reply(`Sorry, an unexpected error occured:\n\n\`${err}\`\nPlease report this error in the support server: <http://support.timeplayed.xyz>`)
                      return message.reply(`Success! I've removed all your \`${handledArgs.other}\` data from my database.`)
                    })
                  })
                })
              })
            }
    
            if(command === "setprivacy") {
              message.channel.send(lang.commands.setPrivacy.choices).then(msg => {
                awaitReaction(msg, ["🇦", "🇧", "🇨"], message.author.id, function(reaction, choice) {
                  tools.setPrivacy(message.author.id, message.guild.id, choice, function(success) {
                    if(choice == 0) return message.reply(lang.commands.setPrivacy.localPrivate)
                    if(choice == 1) return message.reply(lang.commands.setPrivacy.globalPrivate)
                    if(choice == 2) return message.reply(lang.commands.setPrivacy.globalPublic)
                  })
                })
              })
            }

            if(command === "acceptmessage") {
              if(!message.member.permissions.has("MANAGE_CHANNELS")) return message.reply("You need the `Manage Channels` permission to do that!")
                function sendAccept() {
                  var keep = true;
                  if(handledArgs.other == "false" || handledArgs.other == "no") keep = false;
                  message.channel.send(lang.general.globalAccept.replace("%guild%", guildName)).then(msg => {
                    msg.react("✅")
                    if(!keep) return;
                    connection.query("INSERT INTO acceptMessages (messageID, channelID) VALUES (?, ?)", [msg.id, msg.channel.id], function(error, results, fields) {
                      acceptCollector(msg)
                    })
                  })
                }
                connection.query("SELECT * FROM acceptMessages WHERE channelID=?", [message.channel.id], function(error, results, fields) {
                  if(results.length >= 1) return message.reply("You can only have 1 accept message per channel! React with ✅ to delete the previous one and send a new one").then(msg => {
                    awaitReaction(msg, ["✅"], message.author.id, function(reaction, choice) {
                      msg.delete()
                      client.channels.get(results[0].channelID).fetchMessage(results[0].messageID).then(previous => {
                        previous.delete()
                        sendAccept()
                      })
                    })
                  })
                  sendAccept()
                })
            }
            
            if(command === "accept") {
              tools.setTerms(message.author.id, true, function() {
                return message.reply(lang.general.termsAccepted)
              })
            }
    
            if(command === "erase") {
              message.reply(lang.commands.erase.confirmation).then(msg => {
                awaitReaction(msg, ["✅"], message.author.id, function() {
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
              if(message.member.hasPermission("ADMINISTRATOR")) {
                var guildSettings = JSON.parse(JSON.stringify(guildConf));
                if(Object.keys(lang.commands.setConfig.availableValues).includes(handledArgs.key)) {
                  if(handledArgs.key == "rankingChannel" || handledArgs.key == "enableRankingMentions" || handledArgs.key == "leaderboardAmount") {
                    if(!premium) return message.reply(lang.errors.premiumOnly)
                    if(handledArgs.key == "rankingChannel") {
                      var channelID = handledArgs.value.replace(/[<#>]+/g, "")
                      var channel = message.guild.channels.get(channelID)
                      if(channelID && !channel && handledArgs.value != "none") return message.reply(lang.commands.setConfig.noValidChannel)
                      var perms = [["VIEW_CHANNEL", "Read Messages"], ["SEND_MESSAGES", "Send Messages"], ["MANAGE_MESSAGES", "Manage Messages"]]
                      var missingPerm;
                      perms.forEach(perm => {
                        if(!message.guild.me.permissionsIn(channel).has(perm[0])) {
                          missingPerm = perm[1]
                        }
                      })
                      if(missingPerm) return message.reply(lang.commands.setConfig.noRankingPermissions.replace("%permission%", missingPerm).replace("%channel%", handledArgs.value))
                      handledArgs.value = channelID;
                    }
                  }
                  var correctType = lang.commands.setConfig.availableValues[handledArgs.key]
                  var wrongDataType = lang.commands.setConfig.wrongDataType.replace("%key%", handledArgs.key).replace("%type%", correctType)
                  var types = {string: " (text)", number: "", boolean: " (true/false)", textChannel: " (mention a #channel)"}
                  wrongDataType += `${types[correctType]}!`
                  if(handledArgs.type != lang.commands.setConfig.availableValues[handledArgs.key]) return message.reply(wrongDataType)
                  if(handledArgs.key == "leaderboardAmount" && Number(handledArgs.value) > 10) return message.reply(lang.commands.setConfig.moreThanTen)

                  var value = handledArgs.value;
                  if(value == "true") value = 1;
                  if(value == "false") value = 0;
                  connection.query(`UPDATE guildSettings SET ${handledArgs.key}=? WHERE guildID=?`, [value, guildID], function(err, results, fields) {
                    if(err) return message.reply(`Error: ${err}`)
                    return message.reply(lang.commands.setConfig.success.replace("%key%", handledArgs.key).replace("%value%", handledArgs.value));
                  })
                  
                } else if(handledArgs.key == "roleAwards") {
                  return message.reply(lang.commands.setConfig.roleAwards);
                } else {
                  var availableSettings = ""
                  Object.keys(lang.commands.setConfig.availableValues).forEach(key => {
                    var type = lang.commands.setConfig.availableValues[key]
                    availableSettings += `\`${key}\` (${type})\n`
                  })
                  return message.reply(lang.commands.setConfig.unknownSetting.replace("%availableSettings%", availableSettings))
                }
              } else {
                message.reply(lang.errors.noPermission)
              }
            }
    
            if(command === "showconfig") {
              if(message.member.hasPermission("ADMINISTRATOR")) {
                var string = "Server config:\n"
                var i;
                var l = Object.keys(guildConf).length;
                for (i = 0; i < l; i++) {
                  if(Object.keys(guildConf)[i] == "rankingChannel") {
                    string += `rankingChannel: <#${Object.values(guildConf)[i]}>\n`;
                  } else if(Object.keys(guildConf)[i] == "roleAwards") {
                    string += `roleAwards: Please type \`${guildConf.prefix}showRoles\` to view all role awards.\n`
                  } else if(Object.keys(guildConf)[i] == "leaderboardLayout") {
                    return;
                  } else {
                    string += `${Object.keys(guildConf)[i]}: \`${Object.values(guildConf)[i]}\`\n`;
                  }
                }
                return message.reply(string)
              } else {
                return message.reply(lang.errors.noPermission)
              }
            }
    
            if(command === "addrole") {
              if(message.member.hasPermission("ADMINISTRATOR")) {
                if(message.guild.me.hasPermission("MANAGE_ROLES") == false) {
                  return message.reply(lang.commands.addRole.noPermission)
                }
                var role = getRole(handledArgs.role, message.guild.id)
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
    
            if(command === "removerole") {
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
    
            if(command === "showroles") {
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
          }
          
        })
      })
      

    })
  });
  

})

client.login(token).catch(err => console.log(err))