const keys = require('./keys.json');
const token = keys.botToken;
const Discord = require("discord.js");
const fs = require('fs')
const client = new Discord.Client({disableEveryone: true, autoReconnect:true});
const tools = require('./tools')
var connection = tools.getConnection

// LEADERBOARD

function getPremiumGuilds(callback) {
  connection.query("SELECT guildID FROM premium", function(error, results, fields) {
    var premiums = [];
    results.forEach(result => {
      premiums.push(result.guildID)
    })
    return callback(premiums)
  })
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
  var guild = client.guilds.get(guildID)
  var layout = guildConf.leaderboardLayout;
  var toReplace = [
    ["%serverName%", guild.name],
    ["%game%", guildConf.defaultGame],
    ["%updatedAt%", Date().toString()],
    ["%joinedAt%", guild.joinedAt],
    ["%joinedAgo%", tools.convert.timeDifference(guild.joinedAt)]
  ];
  var sinces = ["weekly", "daily", "always"];
  var amount = 5;
  var lines = layout.split("\n")
  var deleted = [];
  function replaceLayout(lines, toReplace, replacement) {
    lines.forEach((line, lineIndex) => {
      lines[lineIndex] = line.replace(toReplace, replacement)
    })
    return lines;
  }
  sinces.forEach((since, sinceIndex) => {
    for(i = 0; i < amount; i++) {
      var num = i + 1;
      var obj = topLists[sinceIndex][i];
      var mins = 0;
      var user;
      if(obj) {
        mins = obj.minutes
        user = client.users.get(obj.id)
      }
      if(obj && user && mins > 1) {
        lines = replaceLayout(lines, `%${since}${num}-name%`, user.username)
        lines = replaceLayout(lines, `%${since}${num}-tag%`, user.discriminator)
        lines = replaceLayout(lines, `%${since}${num}-mention%`, `<@${user.id}>`)
        lines = replaceLayout(lines, `%${since}${num}-time%`, tools.convert.timeToString(mins))
      } else {
        var vars = ["name", "tag", "mention", "time"];
        var done = [];
        lines.forEach((line, lineIndex) => {
          vars.forEach(name => {
            if(line.includes(`%${since}${num}-${name}%`)) {
              deleted.push({lineIndex: lineIndex, place: num, since: since})
              done.push(lineIndex);
              lines[lineIndex] = "";
            }
          })
        })
      }
    }
  })
  
  var lowestReplacements = {}
  sinces.forEach(since => {
    lowestReplacements[since] = deleted.filter(e => e.since == since).map(e => e.place).sort((a, b) => a-b)[0]
  })

  Object.keys(lowestReplacements).forEach(since => {
    var place = lowestReplacements[since];
    var lineIndex = deleted.filter(e => e.since == since && e.place == place)[0]
    if(lineIndex != undefined) {
      lineIndex = lineIndex.lineIndex
    } else {
      return;
    }
    if(place == 1) {
      var replacement;
      if(since == "daily") replacement = guildConf.leaderboardNoToday
      if(since == "weekly") replacement = guildConf.leaderboardNoWeek
      if(since == "always") replacement = guildConf.leaderboardNoAlways
      lines[lineIndex] = replacement.replace("%game%", guildConf.defaultGame);
    } else {
      var replacement;
      if(since == "daily") replacement = guildConf.leaderboardNoMoreToday
      if(since == "weekly") replacement = guildConf.leaderboardNoMoreWeek
      if(since == "always") replacement = guildConf.leaderboardNoMoreAlways
      lines[lineIndex] = replacement.replace("%game%", guildConf.defaultGame);
    }
  })

  layout = lines.filter(e => e != "").join("\n");
  
  toReplace.forEach(arr => {
    layout = layout.replace(arr[0], arr[1])
  })

  return layout;
}

function updateRankingChannel() {
  console.log("Updating ranking channels...")
  var guilds = [];
  var ids = []
  client.guilds.forEach(guild => {
    ids.push(guild.id)
  })
  tools.getGuildConfigs(function(configs) {
    getPremiumGuilds(function(premiums) {
      client.guilds.forEach(function(guild, index) {
        var i = configs.map(e => {return e.guildID}).indexOf(guild.id)
        if(i < 0) return;
        var guildConf = configs[i].config;
        if(!guildConf.rankingChannel) return;
        var rankingChannel = guild.channels.get(guildConf.rankingChannel);
        var premium = premiums.includes(guild.id);
        if(rankingChannel && premium) {
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
          var premium = premiums.includes(guild.id);
          if(premium && rankingChannel) {
            var index = findWithAttr(results, 'guildID', guild.id)
            if(index != -1) {
              var topLists = results[index].results
              for(var i = 0; i < topLists.length; i++) {
                topLists[i].sort(function(a,b) {return b.minutes - a.minutes})
              }
              fetchBotMessages(20, rankingChannel)
                .then(message => {
                  if(!message) {
                    rankingChannel.send(topListToString(topLists, guildConf, guild.id))
                    console.log(`${Date()}: ${guild.name} leaderboard sent!`)
                  } else {
                    message.edit(topListToString(topLists, guildConf, guild.id))
                    console.log(`${Date()}: ${guild.name} leaderboard edited!`)
                  }
                })
            }
          }
        })
      })
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
    channel.bulkDelete(fetched).catch(err => {console.log("Error bulk deleting messages")})
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
          if(foundIndex == undefined) return;
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
                if(userResult.seconds  < award.time) {
                  // Remove role/send message
                  member.removeRole(role)
                  .catch(err => console.log(err))
                  removeCount++
                  console.log(`Removed ${member.displayName} from the ${role.name} role.`)
                }
              } else {
                if(userResult.seconds > award.time) {
                  // Add role/send message
                  member.addRole(role)
                  .catch(err => console.log(err))
                  addCount++
                  console.log(`Added ${member.displayName} to the ${role.name} role.`)
                }
              }
            }
          })
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
  updateRankingChannel();
  setInterval(updateRankingChannel, 60000);
})

client.login(token)