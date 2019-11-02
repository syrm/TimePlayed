const tools = require("../tools");
const Discord = require("discord.js")

module.exports = function(obj) {
  var message = obj.message;
  var handledArgs = obj.handledArgs;
  var lang = obj.lang;
  var meantUser = obj.meantUser;

  message.channel.send(lang.general.loadingMessage).then(msg => {
    tools.getStartDate(meantUser.id, function(startDate) {
      var sinceWarning = false;
      if(handledArgs.since && tools.convert.sinceDate(handledArgs.since) < startDate) sinceWarning = true;
      
      if(handledArgs.other) {
        tools.correctGame.user(handledArgs.other, meantUser.id, function(correctedGame) {
          if(!correctedGame) return msg.edit(lang.commands.timePlayed.noPlaytime.replace("%game%", handledArgs.other) + lang.warnings.realityWarning)
          lang = tools.replaceLang(/%game%+/g, correctedGame, lang)
          tools.timePlayed(meantUser.id, correctedGame, handledArgs.since, function(results) {
            if(handledArgs.since) {
              lang = tools.replaceLang(`%timePlayedCustom%`, tools.convert.timeToString(results.time), lang)
              var string = lang.commands.timePlayed.customSince.replace("%customSince%", tools.convert.secondsToTime(tools.convert.stringToSeconds(handledArgs.since)))
              if(sinceWarning == true) {
                string += lang.warnings.sinceWarning
              }
              return msg.edit(string)
            }
            lang = tools.replaceLang(`%timePlayedWeek%`, tools.convert.timeToString(results.week), lang)
            lang = tools.replaceLang(`%timePlayedDay%`, tools.convert.timeToString(results.today), lang)
            lang = tools.replaceLang(`%timePlayedTotal%`, tools.convert.timeToString(results.total), lang)
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
            embed.addField("Online profile", `For more detailed playtime stats, you can visit this user's [online profile](http://www.timeplayed.xyz/profile/${meantUser.id}).`)
            embed.setAuthor(lang.commands.timePlayed.title, meantUser.avatarURL)
            tools.getThumbnail(correctedGame, function(url, color) {
              if(url) embed.setThumbnail(url)
              if(color) embed.setColor(color)
              msg.edit({embed});
            })
          })
        })
        
      } else {
        tools.topGames(meantUser.id, handledArgs.since, function(topGames) {
          var totalSeconds = 0;
          topGames.forEach(function(e) {
              totalSeconds += Number(e.time)
          })
          totalHours = Math.floor(totalSeconds / 3600);

          if(topGames.length < 1 || topGames.every(e => e.time < 1)) {
              if(handledArgs.since) {
                  return msg.edit(lang.commands.timePlayed.noGamePeriod)
              } else {
                  return msg.edit(lang.commands.timePlayed.noGameEver)
              }
          }
          const embed = new Discord.RichEmbed()
          .setColor("#33f76b")
          lang = tools.replaceLang(/(?:\r\n|\r|\n)/g, "", lang)
          if(sinceWarning) {
              embed.setDescription(`- ${lang.warnings.sinceWarning}\n - ${lang.warnings.realityWarning}`)
          } else if(!handledArgs.since) {
              embed.setDescription(`- ${lang.commands.timePlayed.measuredSince}\n - ${lang.warnings.realityWarning}`)
          } else {
              embed.setDescription(lang.warnings.realityWarning)
          }
          if(totalHours < 1) totalHours = "< 1"
          lang = tools.replaceLang("%hours%", totalHours, lang)
          if(handledArgs.since) {
              embed.setTitle(lang.commands.timePlayed.titleCustomSince2.replace("%customSince%", tools.convert.secondsToTime(tools.convert.stringToSeconds(handledArgs.since))), meantUser.avatarURL)
          } else {
              embed.setTitle(lang.commands.timePlayed.title2, meantUser.avatarURL)
          }
          for(var i = 0; i < 10; i++) {
              if(topGames[i] && topGames[i].time / 1000 > 0) {
                  embed.addField(`${i + 1}. ${topGames[i].game}`, tools.convert.timeToString(topGames[i].time))
              }
          }
          embed.addField("Online profile", `For more detailed playtime stats, you can visit this user's [online profile](http://www.timeplayed.xyz/profile/${meantUser.id}).`)
          return msg.edit(embed)
      })
      }
      
    })
  })
}