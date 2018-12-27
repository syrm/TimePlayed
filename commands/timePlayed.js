const tools = require("../tools");
const Discord = require("discord.js")
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
      var gameCorrection = "SELECT game FROM gameAliases WHERE alias=? AND game IN (SELECT DISTINCT GAME FROM playtime WHERE userID=?) UNION SELECT DISTINCT game FROM playtime WHERE userID=? HAVING levenshtein(game, ?) < 4 AND game NOT IN (SELECT alias FROM gameAliases WHERE alias=?)"
      connection.query(gameCorrection, [handledArgs.other, meantUser.id, meantUser.id, handledArgs.other, handledArgs.other], function(error, correctedGames, fields) {
        if(correctedGames.length < 1) return msg.edit(lang.commands.timePlayed.noPlaytime.replace("%game%", handledArgs.other) + lang.warnings.realityWarning)
        handledArgs.other = correctedGames[0].game
        
        lang = tools.replaceLang(/%game%+/g, handledArgs.other, lang)
        
        tools.timePlayed(meantUser.id, handledArgs.other, handledArgs.since, function(results) {
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
          embed.addField("Online profile", `For more detailed playtime stats, you can visit this user's [online profile](http://timeplayed.xyz/profile/${meantUser.id}).`)
          embed.addField(lang.commands.timePlayed.allTitle, lang.commands.timePlayed.all)
          embed.setAuthor(lang.commands.timePlayed.title, meantUser.avatarURL)
          tools.getThumbnail(handledArgs.other, function(url, color) {
            if(url) embed.setThumbnail(url)
            if(color) embed.setColor(color)
            msg.edit({embed});
          })
        })
      })
    })
  })
}