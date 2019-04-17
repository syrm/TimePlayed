// Made by xVaql#4581, all rights reserved
const keys = require('./keys.json');
var beta = keys.beta;
var selfHost = keys.selfHost;
var token = keys.botToken;

// Require everything
const Discord = require("discord.js")
const tools = require("./tools")
const en = require('./lang/en.json')

const execute = require("./commands");

const client = new Discord.Client({disableEveryone: true, autoReconnect:true, fetchAllMembers: true});

var connection = require('./tools/connection.js');

if(!selfHost) {
  DBL = require("dblapi.js")
  request = require('request');
  dbl = new DBL(keys.discordbotsToken, client);
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
  if(beta || selfHost) return;
  var logChannel = client.channels.get("462909240298962944")
  logChannel.send(`\`${message}\``)
  return message;
}

function postStats() {
  dbl.postStats(client.guilds.size)
    .then(err => console.log("Stats posted!"))
    .catch(err => console.log("Error posting stats"));
  request.post(
    `https://discord.bots.gg/api/v1/bots/433625399398891541/stats`,
    {
      json: { guildCount: client.guilds.size },
      headers: {
        'Authorization': keys.discordbotsToken2
      }
    },
    function (error, response, body) {
    }
  );
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
  log("Started up!")
  console.log(`Bot is ready!`);
  console.log(`I'm in ${client.guilds.size} guilds.`)
  setInterval(() => {
    client.user.setActivity(`${client.users.size} users | !!help`, { type: 'WATCHING' });
  }, 60000)
  if(!beta && !selfHost) {
    postStats()
  }
});

client.on("guildCreate", guild => {
  postStats()
  client.user.setActivity(`${client.users.size} users | !!help`, { type: 'WATCHING' });
  var found = false;
  tools.getGuildConfig(guild.id, function(guildConf) {
    guild.channels.forEach(function(channel, id) {
        if(found || channel.type != "text") return;
        if(guild.me.permissionsIn(channel).has("SEND_MESSAGES") && guild.me.permissionsIn(channel).has("VIEW_CHANNEL")) {
          found = true;
          return channel.send(`**Hi there! Thanks for inviting me to your server!**\nThere are a few things you need to know about me:\n- Type \`!!help\` to get a list of my commands\n- My default prefix is \`!!\`, but it can be changed with \`!!setConfig prefix (newPrefix)\`\n- To get to know more about me, take a look at my website (<http://www.timeplayed.xyz>)\n- If you come across any trouble you can always join the support server (<http://support.timeplayed.xyz>)\n- Your playtime is **based on Discord presences**, so if your Discord is closed or your game status is disabled I will not be able to log your playtime and information may become inaccurate\n- The bot starts measuring everyone in this server's playtime from now on, so please give give it some time and don't instantly kick it if it's not working as expected\n**Greetings!**`)
        }
    })
  })

  console.log(`${Date()}: Joined new guild: ${guild.name}, sent welcome message: ${found}`)
  log(`Joined a new server (current server count: ${client.guilds.size})`)
});
client.on("guildDelete", guild => {
  postStats()
  client.user.setActivity(`${client.users.size} users | !!help`, { type: 'WATCHING' });
  log(`Left a server (current server count: ${client.guilds.size})`)
  console.log(`${Date()}: Left guild: ${guild.name}`)
})

client.on("message", message => {
  if(message.author.bot) return;
  var lang = JSON.parse(JSON.stringify(en));
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
  // Check connection health
  connection.query("SELECT * FROM lastRefresh", function(err, results, fields) {
    if(err) {
      // Return if no command

      // Extract command part
      var contentCMD;
      if(message.content.startsWith(`<@${client.user.id}>`)) {
        contentCMD = message.content.replace(/  +/g, ' ').replace(`<@${client.user.id}>`, "").split(/ +/g)[1]
        arg = message.content.replace(/  +/g, ' ').split(/ +/g).slice(2)
      } else if(PM && !message.content.startsWith("!!")) {
        contentCMD = message.content.replace(/  +/g, ' ').split(/ +/g)[0]
        arg = message.content.replace(/  +/g, ' ').split(/ +/g).slice(1)
      } else {
        contentCMD = message.content.replace(/  +/g, ' ').replace("!!", "").split(/ +/g)[0];
        arg = message.content.replace(/  +/g, ' ').split(/ +/g).slice(1)
      }

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
      
      if(commands.indexOf(command) != -1) {
        return message.reply("Sorry, I currently can't reach the playtime database due to connection problems. Please try again in a moment, and if this error keeps occurring report it in my support server (http://support.timeplayed.xyz).")
        .catch(err => console.log(`Error sending database failure message`))
      }
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
      lang = bulkReplaceLang([["%be%", toBe], ["%have%", toHave], ["%person%", person], ["%possessive%", possessive], ["%prefix%", guildConf.prefix], ["%guildId%", guildID], ["%clientId%", client.user.id]], lang)
      if(handledArgs.game) lang = tools.replaceLang(/%game%+/g, handledArgs.game, lang)
      if(command != "timeplayed" && command != "playing") lang = tools.replaceLang(/%game%+/g, handledArgs.other, lang)
  
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
      if(mention) {id = mention.id}
  
      if(PM && mention) return message.reply(lang.errors.noPMMention)
  
      // Execute the private check (async)
      tools.termsCheck(message.author.id, id, guildID, function(results) {
        accept = results[0]
        if(!keys.selfhost) {
          premium = results[1];
        } else {
          premium = true;
        }
        
        connection.query(`SELECT count(*) FROM privateUsers WHERE userID=?`, [id], function(error, results, fields) {
          var private = results[0]["count(*)"] > 0;
          var termsMSG;
          if(accept.executer == undefined && command != "accept") termsMSG = lang.errors.firstTime;
          if(accept.executer == false && command != "accept") termsMSG = lang.errors.stillAccept;
          var reactPerms = false;
          if(message.guild && message.guild.me.permissionsIn(message.channel).has("ADD_REACTIONS")) reactPerms = true;
          var methodMessage = lang.errors.commandMessage
          if(reactPerms) methodMessage = lang.errors.reactionMessage
          if(termsMSG) return message.channel.send(termsMSG + lang.errors.acceptMessageSuffix + methodMessage).then(msg => {
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
      
          // If user ran timeplayed without game, redirect to topplayed command
          if(command == "timeplayed" && handledArgs.defaultGame == true) {
            command = "topplayed";
          }
  
          // Get the start date of the user
          tools.getStartDate(id, function(startDate) {
            lang = tools.replaceLang(/%startDateString%+/g, tools.convert.timeDifference(startDate, new Date(), true), lang)
              var meantUser = message.author;
              if(mention) meantUser = mention;
              var info = {
                message: message,
                client: client,
                handledArgs: handledArgs,
                guildConf: guildConf,
                lang: lang,
                meantUser: meantUser,
                premium: premium
              }
              if(execute[command]) {
                execute[command].call(undefined, info);
              }
          })
        })
      })
    });
  })
})

client.on('error', function() {
  console.log("Connection failed")
});

client.login(token).catch(err => console.log(err))