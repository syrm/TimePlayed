const tools = require("../tools");
const Discord = require("discord.js")
var connection = tools.getConnection;

module.exports = function(message, handledArgs, id, mention, lang) {
  message.channel.send('<a:loading:455383347921682433>').then(msg => {
    tools.getStartDate(id, function(startDate) {
      connection.query("SELECT game FROM playtime WHERE userID=? AND soundex(game) = soundex(?)", [id, handledArgs.other], function(error, correctedGames, fields) {
        if(correctedGames.length < 1) return msg.edit(lang.commands.timePlayed.noPlaytime.replace("%game%", handledArgs.other) + lang.warnings.realityWarning)
        var correctedGame = correctedGames[0].game
        correctedGames.forEach(obj => {
          if(obj.game.toLowerCase() == handledArgs.other.toLowerCase()) {
            correctedGame = obj.game
          }
        })
        handledArgs.other = correctedGame;
        lang = tools.replaceLang(/%game%+/g, handledArgs.other, lang)
        var sinces = []
        if(!handledArgs.since) {
          sinces = ['7d', 'today', undefined]
        } else {
          sinces.push(handledArgs.since)
        }
        tools.timePlayed(id, handledArgs.other, sinces, function(results) {
          times = [["7d", "Week"], ["today", "Day"], [undefined, "All"], [handledArgs.since, "Custom"]]
          times.forEach(since => {
            lang = tools.replaceLang(`%timePlayed${since[1]}%`, tools.convert.timeToString(results[since[0]]), lang)
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
          if(mention) {
            embed.setAuthor(lang.commands.timePlayed.title, mention.avatarURL)
          } else {
            embed.setAuthor(lang.commands.timePlayed.title, message.author.avatarURL)
          }
          tools.getThumbnail(handledArgs.other, function(url) {
            embed.setThumbnail(url)
            msg.edit({embed});
          })
        })
      })
    })
  })
  
    
}