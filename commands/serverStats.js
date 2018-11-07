var tools = require("../tools")
var connection = tools.getConnection
const Discord = require("discord.js")

module.exports = function(obj) {
  var message = obj.message;
  var lang = obj.lang;
  var handledArgs = obj.handledArgs;
  if(!obj.premium) return message.reply("This command is for premium servers only! To keep complete track of the gaming behavior from members in this server, please consider buying premium for this server at https://www.patreon.com/TimePlayed.")
  message.channel.send(lang.general.loadingMessage).then(msg => {
    connection.query("SELECT assignedAt FROM premium WHERE guildID=?", [message.guild.id], function(error, premiumResults, fields) {
      var startLogging = premiumResults[0].assignedAt;
      var now = new Date();
      var oneDay = 24*60*60*1000;
      var numDays = Math.ceil(Math.abs((startLogging.getTime() - now.getTime())/(oneDay)));
      if(handledArgs.defaultGame) {
        connection.query("SELECT * FROM guildStats WHERE guildID=?", [message.guild.id], function(error, results, fields) {
          if(results.length < 1) return msg.edit(`It seems like no one in this server ever played any game! This might be because I just started logging everyone's playtime in this server, so please try again later.`)
          const embed = new Discord.RichEmbed()
          .setAuthor(`${message.guild.name}'s stats`, message.guild.iconURL)
          .setColor(3447003)
          .setDescription(`Welcome to \`${message.guild.name}\`'s full statistics.`)
          function topGames(since, ignoreErrors) {
            since = tools.convert.sinceDate(since);
            if(since < startLogging && !ignoreErrors) return undefined;
            var games = [];
            results.forEach(function(result, i) {
              if(!result.endDate) {
                if(i != results.length - 1) {
                  return;
                } else {
                  result.endDate = new Date()
                }
              }
              var diffMS = 0;
              if(result.endDate > since) {
                if(result.startDate < since) {
                  diffMS = Math.abs(result.endDate.getTime() - since.getTime())
                }
                if(result.startDate > since) {
                  diffMS = Math.abs(result.endDate.getTime() - result.startDate.getTime());
                }
              }
              if(diffMS < 1) return;
              if(games.some(e => e.game == result.game)) {
                  var index = games.map(e => {return e.game}).indexOf(result.game);
                  games[index].time += Math.floor(diffMS / 1000);
              } else {
                  var users = [];
                  results.forEach(e => {
                    if(e.game == result.game && !users.includes(e.userID)) users.push(e.userID);
                  })
                  games.push({game: result.game, time: Math.floor(diffMS / 1000), users: users.length})
              }
            })
            games.sort(function(a, b){return b.time-a.time});
            return games;
          }
          function topListToString(list, days) {
            if(!list && days == 7) return "Can't show, playtime started measuring after a week ago!";
            if(!list && days == 30) return "Can't show, playtime started measuring after a month ago!";
            if(list.length < 1) return "Nothing to show!";
            var str = "";
            list.forEach((obj, i) => {
              if(i > 4) return;
              var newLine = "\n";
              if(i == list.length - 1) newLine = "";
              var s = "";
              if(obj.users > 1) s = "s";
              str += `**${i + 1}. ${obj.game}** (${obj.users} player${s})\n*${tools.convert.timeToString(obj.time)}*\nAverage per day: *${tools.convert.timeToString(obj.time / days)}*${newLine}`;
            })
            return str;
          }
          var topWeek = topGames("7d");
          var topMonth = topGames("30d");
          var topAlways = topGames("always", true);
          embed.addField("Total played games", topAlways.length, true);
          var totalTime = 0;
          topAlways.forEach(obj => {
            totalTime += obj.time;
          })
          embed.addField("Total time any games played", tools.convert.timeToString(totalTime), true);
          embed.addField("Average daily gaming time per user", tools.convert.timeToString(totalTime / numDays / message.guild.members.size), true);
          embed.addField("Weekly top played games", topListToString(topWeek, 7))
          embed.addField("Monthly top played games", topListToString(topMonth, 30))
          embed.addField("Total top played games", topListToString(topAlways, numDays))
          return msg.edit(embed);
        })
      } else {
        connection.query("SELECT * FROM guildStats WHERE guildID=? AND game=?", [message.guild.id, handledArgs.other], function(error, results, fields) {
          if(results.length < 1) return msg.edit(`It seems like no one in this server ever played \`${handledArgs.other}\`! Please check your spelling or try again with a different game.`)
          var numUsers = [];
          results.forEach(result => {
            if(!numUsers.includes(result.userID)) numUsers.push(result.userID)
          })
          numUsers = numUsers.length;
          numUsersPercent = Math.round(numUsers / message.guild.members.size * 100 * 100) / 100
          function tp(since, ignoreErrors) {
            var time = 0;
            since = tools.convert.sinceDate(since);
            if(since < startLogging && !ignoreErrors) return undefined;
            results.forEach((result, i) => {
              if(!result.endDate) {
                if(i != results.length - 1) {
                  return;
                } else {
                  result.endDate = new Date()
                }
              }
              var diffMS = 0;
              if(result.endDate > since) {
                if(result.startDate < since) {
                  diffMS = Math.abs(result.endDate.getTime() - since.getTime())
                }
                if(result.startDate > since) {
                  diffMS = Math.abs(result.endDate.getTime() - result.startDate.getTime());
                }
              }
              if(diffMS < 1) return;
              time += Math.floor(diffMS / 1000);
            })
            return time;
          }
          var tpWeek = tp("7d")
          var tpMonth = tp("30d")
          var tpTotal = tp("total", true)
          function tts(num, days) {
            if(!num && days == 7) return "Can't show, playtime started measuring after a week ago!";
            if(!num && days == 30) return "Can't show, playtime started measuring after a month ago!";
            return `*${tools.convert.timeToString(num)}*\nAverage per day: *${tools.convert.timeToString(num / days)}*`;
          }
          const embed = new Discord.RichEmbed()
            .setAuthor(`${message.guild.name}'s stats`, message.guild.iconURL)
            .setColor(3447003)
            .setDescription(`Welcome to \`${message.guild.name}\`'s \`${handledArgs.other}\` statistics.`)
            .addField(`Amount of users who ever played ${handledArgs.other}`, `**${numUsers}** (${numUsersPercent}% of all server members)`, true)
            .addField(`Average playtime per user per day`, `Including users who never played \`${handledArgs.other}\`:\n*${tools.convert.timeToString(tpTotal / numDays / message.guild.members.size)}*\nExcluding users who have never played \`${handledArgs.other}\`:\n*${tools.convert.timeToString(tpTotal / numDays / numUsers)}*`)
            .addField("Weekly time played", tts(tpWeek, 7))
            .addField("Monthly time played", tts(tpMonth, 30))
            .addField("Total time played", tts(tpTotal, numDays))
          return msg.edit(embed);
        })
      }
    })
  })
}