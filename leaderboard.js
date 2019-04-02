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
      reg = new RegExp(toReplace, "gm");
      lines[lineIndex] = line.replace(reg, replacement)
    })
    return lines;
  }
  sinces.forEach((since, sinceIndex) => {
    for(i = 0; i < amount; i++) {
      var num = i + 1;
      var obj = topLists[sinceIndex][i];
      var secs = 0;
      var user;
      if(obj) {
        secs = obj.seconds
        user = client.users.get(obj.id)
      }
      if(obj && user && secs > 1) {
        lines = replaceLayout(lines, `%${since}${num}-name%`, user.username)
        lines = replaceLayout(lines, `%${since}${num}-tag%`, user.discriminator)
        lines = replaceLayout(lines, `%${since}${num}-mention%`, `<@${user.id}>`)
        lines = replaceLayout(lines, `%${since}${num}-time%`, tools.convert.timeToString(secs))
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
                topLists[i].sort(function(a,b) {return b.seconds - a.seconds})
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
  console.log("Updating role awards...")
  var q = `
  SELECT
  playtime.userID AS userID,
  roleAwards.guildID AS guildID,
  roleAwards.roleID AS roleID,
  IF(SUM(TIMESTAMPDIFF(SECOND,startDate, IFNULL(endDate, NOW()))) > roleAwards.time, 1, 0) AS assign

FROM
    playtime

INNER JOIN roleAwards ON playtime.userID IN (SELECT userID FROM userGuilds WHERE guildID=roleAwards.guildID)

WHERE (
	SUBSTRING_INDEX(SUBSTRING_INDEX(roleAwards.game, '|', 1), '|', -1) = playtime.game
    OR SUBSTRING_INDEX(SUBSTRING_INDEX(roleAwards.game, '|', 2), '|', -1) = playtime.game
    OR SUBSTRING_INDEX(SUBSTRING_INDEX(roleAwards.game, '|', 3), '|', -1) = playtime.game
)
AND playtime.startDate > date_sub(NOW(), INTERVAL roleAwards.per SECOND)
AND userID NOT IN (SELECT userID FROM privateUsers)

GROUP BY playtime.userID, playtime.game, roleAwards.roleID`

  connection.query(q, function(error, toAssign, fields) {
    toAssign.forEach(obj => {
      var guild = client.guilds.get(obj.guildID)
      if(!guild) return;
      var member = guild.members.get(obj.userID)
      if(!member) return;
      var role = guild.roles.get(obj.roleID)
      if(!role) return;
      var assign;
      if(obj.assign == 1) assign = true;
      if(obj.assign == 0) assign = false;
      if(member.roles.get(role.id) && !assign) {
        console.log(`Removed ${member.user.tag} from the ${role.name} role in ${guild.name}`)
        member.removeRole(role)
        .catch(err => console.log("Perm error"))
        
      } else if(!member.roles.get(role.id) && assign) {
        console.log(`Added ${member.user.tag} to the ${role.name} role in ${guild.name}`)
        member.addRole(role)
        .catch(err => console.log("Perm error"))
      }
    })
      console.log(`Done!`)
  })
    
}

client.on("ready", () => {
  console.log("Ready!")
  updateRoles()
  setInterval(updateRoles, 60000);
  updateRankingChannel();
  setInterval(updateRankingChannel, 60000);
})

client.on('error', console.log("Connection failed"));

client.login(token)