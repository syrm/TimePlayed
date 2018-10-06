const tools = require("../tools");
const Discord = require("discord.js")
var connection = tools.getConnection;
module.exports = function() {
    tools.timePlayed(id, guildConf.defaultGame, defaultSinces, function(results) {
    // Check if there is actually a ranking channel in the server and if the server has premium
    if(premium == false) return msg.edit(lang.errors.premiumOnly)
    if(!guildConf.rankingChannel || guildConf.rankingChannel == "none") return msg.edit(lang.errors.noRankingChannel)
    if(fs.existsSync(`./data/cache/${message.guild.id}`)) {
      function getPlace(since) {
        return tools.convert.ordinalSuffix(JSON.parse(fs.readFileSync(`./data/cache/${message.guild.id}/${since}.json`)).map(e => e.id).indexOf(id) + 1)
      }
      // Replace all the variables in the message file
      var times = [["weekly", "Week"], ["daily", "Day"], ["always", "All"]]
      times.forEach(time => {
        lang = tools.replaceLang(`%place${time[1]}%`, getPlace(time[0]), lang)
      })
      times = [["weekly", "Week"], ["daily", "Day"], ["always", "All"]]
      times.forEach(place => {
        lang = tools.replaceLang(`%place${place[1]}%`, getPlace(place[0]), lang)
      })
      times = [["7d", "Week"], ["today", "Day"], [undefined, "All"]]
      times.forEach(since => {
        lang = tools.replaceLang(`%timePlayed${since[1]}%`, tools.convert.timeToString(results[since[0]]), lang)
      })
      if(results[undefined] == 0) {
        return msg.edit(lang.commands.serverTop.noPlaytime)
      }
      const embed = new Discord.RichEmbed()
      .setAuthor(lang.commands.serverTop.title, meantUser.avatarURL)
      .setColor(0x00AE86)
      .setDescription(realityWarning)
      .setFooter(lang.commands.serverTop.footer.replace("%updatedAt%", fs.readFileSync(`./data/cache/${message.guild.id}/date.txt`)))
      .setThumbnail(tools.getThumbnail(game))
      .setDescription(lang.commands.serverTop.checkRankingChannel.replace("%amount%", guildConf.leaderboardAmount).replace("%rankingChannel%", guildConf.rankingChannel))
      if(results["7d"] == 0) {
        embed.addField(lang.commands.serverTop.weekTitle, lang.commands.serverTop.noWeekly)
      } else {
        embed.addField(lang.commands.serverTop.weekTitle, lang.commands.serverTop.weekly)
      }
      if(results["today"] == 0) {
        embed.addField(lang.commands.serverTop.dayTitle, lang.commands.serverTop.noDaily)
      } else {
        embed.addField(lang.commands.serverTop.dayTitle, lang.commands.serverTop.daily)
      }
      embed.addField(lang.commands.serverTop.allTitle, lang.commands.serverTop.all)
      msg.edit({embed});
    } else {
      return msg.edit(lang.errors.noLeaderboardFile)
    }
  })
}