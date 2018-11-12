const tools = require("../tools");
const Discord = require("discord.js")
var levenshtein = require('fast-levenshtein');
var connection = tools.getConnection;

module.exports = function(obj) {
  var message = obj.message;
  var handledArgs = obj.handledArgs;
  var lang = obj.lang;
  var meantUser = obj.meantUser;

  message.channel.send(lang.general.loadingMessage).then(msg => {
    tools.getStartDate(meantUser.id, function(startDate) {
      var sinceWarning = false;
      if(handledArgs.since && tools.convert.sinceDate(handledArgs.since) < startDate) sinceWarning = true;
      connection.query("SELECT DISTINCT game FROM playtime WHERE userID=?", [meantUser.id], function(error, userGames, fields) {
        var matches = [];
        userGames.forEach(e => {
            if(!matches.map(e => {return e[0]}).includes(e.game)) {
              matches.push([e.game, levenshtein.get(handledArgs.other, e.game)])
            }
        })
        matches.sort(function(a, b) {
          return a[1] - b[1];
        });
        if(matches[0]) {
          var bestMatch = matches[0][0]
          var bestMatchNum = matches[0][1]
        }
        connection.query("SELECT game FROM gameAliases WHERE alias=?", [handledArgs.other], function(error, aliases, fields) {
          var alias;
          if(aliases.length > 0) alias = aliases[0].game
          if(bestMatchNum > 3 && !alias) return msg.edit(lang.commands.timePlayed.noPlaytime.replace("%game%", handledArgs.other) + lang.warnings.realityWarning)
          if(alias) {
            handledArgs.other = alias;
          } else {
            handledArgs.other = bestMatch;
          }
          lang = tools.replaceLang(/%game%+/g, handledArgs.other, lang)
          var sinces = []
          if(!handledArgs.since) {
            sinces = ['7d', 'today', undefined]
          } else {
            sinces.push(handledArgs.since)
          }
          tools.timePlayed(meantUser.id, handledArgs.other, sinces, function(results) {
            times = [["7d", "Week"], ["today", "Day"], [undefined, "All"], [handledArgs.since, "Custom"]]
            times.forEach(since => {
              lang = tools.replaceLang(`%timePlayed${since[1]}%`, tools.convert.timeToString(results[since[0]]), lang)
            })
            if(handledArgs.since) {
              var string = lang.commands.timePlayed.customSince.replace("%customSince%", tools.convert.secondsToTime(tools.convert.stringToSeconds(handledArgs.since)))
              if(sinceWarning == true) {
                string += lang.warnings.sinceWarning
              }
              return msg.edit(string)
            }
            const embed = new Discord.RichEmbed()
            .setColor(3447003)
            .setDescription(lang.warnings.realityWarning)
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
            embed.setAuthor(lang.commands.timePlayed.title, meantUser.avatarURL)
            tools.getThumbnail(handledArgs.other, obj.client, function(url) {
              embed.setThumbnail(url)
              msg.edit({embed});
            })
          })
        })
      })
    })
  })
  
    
}