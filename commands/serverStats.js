var tools = require("../tools")
const Discord = require("discord.js")
var levenshtein = require('fast-levenshtein');

var mysql = require('mysql');
const keys = require('../keys.json')
var connection = mysql.createPool({
    connectionLimit : 3,
    host: keys.mysqlhost,
    user: keys.mysqlusername,
    password: keys.mysqlpasswd,
    database: 'timeplayed',
    supportBigNumbers: true,
    charset: 'utf8mb4',
    multipleStatements: true
});

var qTP = `
SELECT
    SUM(IF(
        startDate > NOW() - INTERVAL 1 WEEK,
        TIMESTAMPDIFF(SECOND,startDate, IFNULL(endDate, NOW())),
        0)) AS week,
    SUM(IF(
		    startDate > NOW() - INTERVAL 30 DAY,
        TIMESTAMPDIFF(SECOND,startDate, IFNULL(endDate, NOW())),
        0)) AS month,
	  SUM(
		    TIMESTAMPDIFF(SECOND,startDate, IFNULL(endDate, NOW()))
        ) AS total,
    COUNT(DISTINCT userID) AS count
FROM
    guildStats
WHERE
    guildID = ?
    AND game = ?`


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
      if(!handledArgs.game) {
        var q = `
        SELECT
          game,
            SUM(TIMESTAMPDIFF(SECOND,startDate, IFNULL(endDate, NOW()))) AS time,
            COUNT(DISTINCT userID) AS count
        FROM
            guildStats
        WHERE
            guildID = ?
            %gamesOnly%
        GROUP BY game
        ORDER BY %orderBy% DESC
        LIMIT 5;

        SELECT
          game,
            SUM(TIMESTAMPDIFF(SECOND,startDate, IFNULL(endDate, NOW()))) AS time,
            COUNT(DISTINCT userID) AS count
        FROM
            guildStats
        WHERE
            guildID = ?
            AND startDate > NOW() - INTERVAL 1 WEEK
            %gamesOnly%
        GROUP BY game
        ORDER BY %orderBy% DESC
        LIMIT 5;

        SELECT
          game,
            SUM(TIMESTAMPDIFF(SECOND,startDate, IFNULL(endDate, NOW()))) AS time,
            COUNT(DISTINCT userID) AS count
        FROM
            guildStats
        WHERE
            guildID = ?
            AND startDate > NOW() - INTERVAL 30 DAY
            %gamesOnly%
        GROUP BY game
        ORDER BY %orderBy% DESC
        LIMIT 5;

        SELECT
          SUM(TIMESTAMPDIFF(SECOND,startDate, IFNULL(endDate, NOW()))) AS time
        FROM
          guildStats
        WHERE
            guildID = ?
            %gamesOnly%`
        if(handledArgs.gamesOnly == true) {
          q = q.replace(/%gamesOnly%/gm, 'AND game NOT IN (SELECT game FROM knownGames WHERE type=2)')
        } else {
          q = q.replace(/%gamesOnly%/gm, '')
        }
        if(handledArgs.sortBy == 'count') {
          q = q.replace(/%orderBy%/gm, 'count')
        } else {
          q = q.replace(/%orderBy%/gm, 'time')
        }
        connection.query(q, [message.guild.id, message.guild.id, message.guild.id, message.guild.id], function(error, results, fields) {
          if(results.length < 1) return msg.edit(`It seems like no one in this server ever played any game! This might be because I just started logging everyone's playtime in this server, so please try again later.`)
          const embed = new Discord.RichEmbed()
          .setAuthor(`${message.guild.name}'s stats`, message.guild.iconURL)
          .setColor(3447003)
          .setDescription(`Welcome to \`${message.guild.name}\`'s full statistics.`)

          function topListToString(list, days) {
            if(list.length < 1) return "No playtime in the period logged yet!";
            var str = "";
            list.forEach((obj, i) => {
              var newLine = "\n";
              if(i == list.length - 1) newLine = "";
              var s = "";
              if(obj.count > 1) s = "s";
              str += `**${i + 1}. ${obj.game}** (${obj.count} player${s})\n*${tools.convert.timeToString(obj.time)}*\nAverage per day: *${tools.convert.timeToString(obj.time / days)}*${newLine}`;
            })
            return str;
          }
          embed.addField("Total played games", results[0].length, true);
          var totalTime = results[3][0].time;
          
          embed.addField("Total time any games played", tools.convert.timeToString(totalTime), true);
          embed.addField("Average daily gaming time per user", tools.convert.timeToString(totalTime / numDays / message.guild.members.size), true);
          embed.addField("Weekly top played games", topListToString(results[2], 7))
          embed.addField("Monthly top played games", topListToString(results[1], 30))
          embed.addField("Total top played games", topListToString(results[0], numDays))
          embed.addField("Online profile", `For more detailed playtime stats, you can visit this server's [online profile](http://www.timeplayed.xyz/server/${message.guild.id}).`)
          return msg.edit(embed);
          
        })
      } else {
        tools.correctGame.server(handledArgs.game, message.guild.id, function(correctedGame) {
          if(!correctedGame) return msg.edit(`It seems like no one in this server ever played \`${handledArgs.game}\` or something simalar! Please check your spelling or try again with a different game.`)
          connection.query(qTP, [message.guild.id, correctedGame], function(error, results, fields) {
            numUsers = results[0].count
            numUsersPercent = Math.round(numUsers / message.guild.members.size * 100 * 100) / 100
            function tts(num, days) {;
              return `*${tools.convert.timeToString(num)}*\nTotal average per day: *${tools.convert.timeToString(num / days)}*`;
            }
            const embed = new Discord.RichEmbed()
              .setAuthor(`${message.guild.name}'s stats`, message.guild.iconURL)
              .setColor(3447003)
              .setDescription(`Welcome to \`${message.guild.name}\`'s \`${correctedGame}\` statistics.`)
              .addField(`Amount of users who ever played ${correctedGame}`, `**${numUsers}** (${numUsersPercent}% of all server members)`, true)
              .addField(`Average playtime per user per day`, `Including users who never played \`${correctedGame}\`:\n*${tools.convert.timeToString(results[0].total / numDays / message.guild.members.size)}*\nExcluding users who have never played \`${correctedGame}\`:\n*${tools.convert.timeToString(results[0].total / numDays / numUsers)}*`)
              .addField("Weekly time played", tts(results[0].week, 7))
              .addField("Monthly time played", tts(results[0].month, 30))
              .addField("Total time played", tts(results[0].total, numDays))
              .addField("Online profile", `For more detailed playtime stats, you can visit this server's [online profile](http://www.timeplayed.xyz/server/${message.guild.id}).`)
            return msg.edit(embed);
          })
        })
      }
    })
  })
}