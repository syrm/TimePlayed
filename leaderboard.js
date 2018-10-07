const keys = require('./keys.json');
const token = keys.botToken;
const Discord = require("discord.js");
const fs = require('fs')
const client = new Discord.Client({disableEveryone: true, autoReconnect:true});
const tools = require('./tools')
var connection = tools.getConnection

// LEADERBOARD

function checkGuildPremium(guildID) {
  var premium = false;
  fs.readdirSync(`./data/premiumUsers/`).forEach(file => {
    if(fs.readFileSync(`./data/premiumUsers/${file}`) == guildID) {
      premium = true;
    }
  })
  return premium;
}

function findWithAttr(array, attr, value) {
  for(var i = 0; i < array.length; i += 1) {
      if(array[i][attr] === value) {
          return i;
      }
  }
  return -1;
}

function topListToString(topLists, guildConf, guildID) {
  function sinceBoard(sinceString, since) {
    var string = `**----------------- ${sinceString} -----------------**\n`
    var topList;
    var emptyString;
    var noMoreString;
    if(since == "7d") {
      topList = topLists[0];
      emptyString = `No one played ${guildConf.defaultGame} this week!`
      noMoreString = `No more users played ${guildConf.defaultGame} this week!`
      var d = new Date();
      d.setDate(d.getDate()-7);
      if(guild.joinedAt > d) {
        return `${string}I joined this server less than a week ago, so this leaderboard would be the same as the "Always" leaderboard. Go check out that one!`
      }
    }
    if(since == "today") {
      topList = topLists[1];
      emptyString = `No one played ${guildConf.defaultGame} today!`
      noMoreString = `No more users played ${guildConf.defaultGame} today!`
      var vanochtend = new Date();
      vanochtend.setHours(6);
      vanochtend.setMinutes(0);
      vanochtend.setSeconds(0);
      vanochtend.setMilliseconds(0)
      if(guild.joinedAt > vanochtend) {
        return `${string}I joined this server today, so this leaderboard would be the same as the "Always" leaderboard. Go check out that one!`
      }
    }
    if(since == undefined || since == "") {
      topList = topLists[2];
      noMoreString = `No more users have ever played ${guildConf.defaultGame}!`
      emptyString = `No one has ever played ${guildConf.defaultGame}!`
    }
    var l = guildConf.leaderboardAmount;
    var amount = 0;
    for (let i = 0; i < l; i++) {
      if(topList[i] == undefined) {
        break;
      }
      var userIndex = topList.map(function(e) { return e.id; }).indexOf(topList[i].id)
      var userTimePlayed = topList[userIndex].minutes;
      var userID = topList[userIndex].id;
      var userTag
      if(guildConf.enableRankingMentions != true) userTag = client.users.get(userID).tag
      if(i == 0) {
        if(userTimePlayed > 0) {
          if(guildConf.enableRankingMentions == true) {
            string += `1. <@${userID}> 👑 *- ${tools.convert.timeToString(userTimePlayed * 60000)}*\n`;
            amount++;
          } else {
            string += `1. **${userTag}** 👑 *- ${tools.convert.timeToString(userTimePlayed * 60000)}*\n`;
            amount++;
          }
        }
      } else {
        if(userTimePlayed > 0) {
          if(guildConf.enableRankingMentions == true) {
            string += `${i + 1}. <@${userID}> *- ${tools.convert.timeToString(userTimePlayed * 60000)}*\n`;
            amount++;
          } else {
            string += `${i + 1}. **${userTag}** *- ${tools.convert.timeToString(userTimePlayed * 60000)}*\n`;
            amount++;
          }
        }
      }
    }
    if(amount < guildConf.leaderboardAmount) {
      if(amount == 0) {
        string += emptyString;
      } else {
      string += noMoreString;
      }
    }
    return string;
  }
  var guild = client.guilds.get(guildID)
  var realityWarning = `*Please realize that this information is based on Discord presences and it can deviate from reality.*`
  return `*${guild.name}'s* \`${guildConf.defaultGame}\` leaderboard:\n${sinceBoard("WEEKLY", "7d")}\n${sinceBoard("TODAY", "today")}\n${sinceBoard("ALWAYS*", undefined)}\n**------------------------------------------------**\nLast updated at: \`${Date().toString()}\`\n*I joined this server \`${tools.convert.timeDifference(guild.joinedAt)}\`, the times I started measuring your playtime can vary per user.\n\n${realityWarning}`

}

function updateRankingChannel(callback) {
  console.log("Updating ranking channels...")
  var guilds = [];
  tools.getGuildConfigs(function(configs) {
    client.guilds.forEach(function(guild, index) {
      var i = configs.map(e => {return e.guildID}).indexOf(guild.id)
      if(i < 0) return;
      var guildConf = configs[i].config;
      if(!guildConf.rankingChannel) return;
      var rankingChannel = guild.channels.get(guildConf.rankingChannel);
      var premium = checkGuildPremium(guild.id)
      if(rankingChannel && premium == true) {
        // Permission check
        if(guild.me.permissionsIn(rankingChannel).has("VIEW_CHANNEL") == false) return console.log(`No permissions to read messages in ranking channel, aborting (server: ${guild.name})`);
        if(guild.me.permissionsIn(rankingChannel).has("SEND_MESSAGES") == false) return console.log(`No permissions to send messages in ranking channel, aborting (server: ${guild.name})`);
        if(guild.me.permissionsIn(rankingChannel).has("MANAGE_MESSAGES") == false) return console.log(`No permissions to manage messages in ranking channel, aborting (server: ${guild.name})`);
        var idList = []
        guild.members.forEach(member => {
          idList.push(member.id)
        })
        guilds.push({guildID: guild.id, game: guildConf.defaultGame, ids: idList})
      }
    })
  
    tools.bulkTimeplayed(guilds, ["7d", "today", undefined], function(results) {
      client.guilds.forEach(guild => {
        var i = configs.map(e => {return e.guildID}).indexOf(guild.id)
        if(i < 0) return;
        var guildConf = configs[i].config;
        var rankingChannel = guild.channels.get(guildConf.rankingChannel);
        var premium = checkGuildPremium(guild.id)
        if(premium && rankingChannel) {
          if(guild.me.permissionsIn(rankingChannel).has("VIEW_CHANNEL") == false) return console.log(`No permissions to read messages in ranking channel, aborting (server: ${guild.name})`);
          if(guild.me.permissionsIn(rankingChannel).has("SEND_MESSAGES") == false) return console.log(`No permissions to send messages in ranking channel, aborting (server: ${guild.name})`);
          if(guild.me.permissionsIn(rankingChannel).has("MANAGE_MESSAGES") == false) return console.log(`No permissions to manage messages in ranking channel, aborting (server: ${guild.name})`);
          var index = findWithAttr(results, 'guildID', guild.id)
          if(index != -1) {
            var topLists = results[index].results
            for(var i = 0; i < topLists.length; i++) {
              topLists[i].sort(function(a,b) {return b.minutes - a.minutes})
            }
  
            fetchBotMessages(20, rankingChannel)
              .then((message) => {
              if(message == undefined) {
                purge(50, rankingChannel).catch(err => {console.log("Error purging rankingChannel!\n" + err)})
                rankingChannel.send(topListToString(topLists, guildConf, guild.id))
                console.log(`${Date()}: ${guild.name} leaderboard sent!`)
              } else {
                message.edit(topListToString(topLists, guildConf, guild.id))
                console.log(`${Date()}: ${guild.name} leaderboard edited!`)
                purge(50, rankingChannel).catch(err => {console.log("Error purging rankingChannel!\n" + err)})
              }
            })
            .catch((err) => {
              console.log("Error calculating leaderboard: \n" + err)
            })
          if(!fs.existsSync(`./data/cache/${guild.id}`)) {
            fs.mkdirSync(`./data/cache/${guild.id}`)
          }
          fs.writeFileSync(`./data/cache/${guild.id}/weekly.json`, JSON.stringify(topLists[0]))
          fs.writeFileSync(`./data/cache/${guild.id}/daily.json`, JSON.stringify(topLists[1]))
          fs.writeFileSync(`./data/cache/${guild.id}/always.json`, JSON.stringify(topLists[2]))
          fs.writeFileSync(`./data/cache/${guild.id}/date.txt`, Date())
          }
        }
      })
      if(callback) callback();
    })
  })
  
}


async function fetchBotMessages(limit, channel) {
  var fetched = await channel.fetchMessages({limit: limit});
  if(fetched.first()) {
    var botFetched = fetched.filter(currentMSG => currentMSG.author.id == client.user.id);
    if(botFetched.first()) {
      return botFetched.first()
    } else {
      return undefined
    }
  } else {
    return undefined
  }
}
async function purge(purgeLimit, channel) {
  var weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate()-7);
  var fetched = await channel.fetchMessages({limit: purgeLimit});
  if(fetched.first()) {
    // Filteren
    fetched = fetched.filter(currentMSG => currentMSG.author.id != client.user.id);
    channel.bulkDelete(fetched)
  }
  fetched = fetched.filter(function (msg) {return msg.author.id == "423433861167579136"});
}

// ROLE AWARDS
function updateRoles() {
  console.log("Checking for role awards...")
  var guilds = [];
  console.time("Updating role awards took");
  connection.query("SELECT * FROM roleAwards", function(error, allAwards, fields) {
    client.guilds.forEach(guild => {
      var awards = allAwards.filter(e => e.guildID == guild.id)
      awards.forEach(award => {
        if(guilds.some(e => e.guildID == guild.id && e.game == award.game && e.since == award.per) == false) {
          // If the guild, same game and since isn't already in the list, push to guilds
          var idList = []
          guild.members.forEach(member => {
            idList.push(member.id)
          })
          guilds.push({guildID: guild.id, game: award.game, since: award.per, ids: idList})
        }
      })
    })
    tools.bulkTimeplayedCustomSince(guilds, function(results) {
      var addCount = 0
      var removeCount = 0
      client.guilds.forEach(guild => {
        var awards = allAwards.filter(e => e.guildID == guild.id)
        awards.forEach(award => {
          var foundIndex;
          results.forEach(function(result, index) {
            if(result.guildID == guild.id && result.game == award.game && result.since == award.per) {
              foundIndex = index;
            }
          })
          if(foundIndex != undefined) {
            guild.members.forEach(member => {
              var index = results[foundIndex].results.map(e => {return e.id}).indexOf(member.id)
              var userResult = results[foundIndex].results[index]
              var role = guild.roles.get(award.roleID)
              var highestBotRole = guild.me.roles.sort(function(a, b) {
                return a.position < b.position
              }).first()
              if(index != -1 && role != undefined) {
                if(guild.me.hasPermission("MANAGE_ROLES") == false || role.position >= highestBotRole.position) return;
                if(member.roles.get(award.roleID)) {
                  if(userResult.minutes * 60000 < Math.abs(new Date() - tools.convert.sinceDate(award.time))) {
                    // Remove role/send message
                    member.removeRole(role)
                    .catch(err => console.log(err))
                    removeCount++
                    console.log(`Removed ${member.displayName} from the ${role.name} role.`)
                  }
                } else {
                  if(userResult.minutes * 60000 > Math.abs(new Date() - tools.convert.sinceDate(award.time))) {
                    // Add role/send message
                    member.addRole(role)
                    .catch(err => console.log(err))
                    addCount++
                    console.log(`Added ${member.displayName} to the ${role.name} role.`)
                  }
                }
              }
            })
          }
        })
      })
      console.timeEnd("Updating role awards took");
      console.log(`Done! Removed ${removeCount} member(s) from roles/added ${addCount} member(s) to roles`)
    })
  })
    
}

client.on("ready", () => {
  console.log("Ready!")
  updateRoles()
  setInterval(updateRoles, 60000);
  /* updateRankingChannel(function() {
    setInterval(updateRankingChannel, 180000);
    updateRoles()
    setInterval(updateRoles, 300000)
  }) */
})

client.login(token)