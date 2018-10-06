const tools = require("../tools");
const Discord = require("discord.js")
module.exports = function(message, handledArgs, id, mention, lang) {
    var meantUser = message.author;
    if(mention) meantUser = mention;
    message.channel.send('<a:loading:455383347921682433>').then(msg => {
        tools.getStartDate(id, function(startDate) {
            var sinceWarning = false;
            if(handledArgs.since && tools.convert.sinceDate(handledArgs.since) < startDate) sinceWarning = true;
            if(handledArgs.other && !handledArgs.defaultGame) return msg.edit(lang.commands.topPlayed.noGame.replace("%arg%", handledArgs.other))
            var customSince = tools.convert.sinceDate(handledArgs.since, true)
            tools.topGames(id, handledArgs.since, function(topGames, totalMS) {
                if(topGames.length < 1 || topGames.every(e => e.time < 1)) {
                if(handledArgs.since) {
                    return msg.edit(lang.commands.topPlayed.noGamePeriod)
                } else {
                    return msg.edit(lang.commands.topPlayed.noGameEver)
                }
                }
                const embed = new Discord.RichEmbed()
                .setColor("#33f76b")
                lang = tools.replaceLang(/(?:\r\n|\r|\n)/g, "", lang)
                if(sinceWarning) {
                    embed.setDescription(`- ${lang.warnings.sinceWarning}\n - ${lang.warnings.realityWarning}`)
                } else if(!handledArgs.since) {
                    embed.setDescription(`- ${lang.commands.topPlayed.measuredSince}\n - ${lang.warnings.realityWarning}`)
                } else {
                    embed.setDescription(lang.warnings.realityWarning)
                }
                var hours = Math.floor(totalMS / 3600000)
                if(hours < 1) hours = "< 1"
                lang = tools.replaceLang("%hours%", hours, lang)
                if(handledArgs.since) {
                    embed.setTitle(lang.commands.topPlayed.titleCustomSince2.replace("%customSince%", tools.convert.sinceToString(handledArgs.since)), meantUser.avatarURL)
                } else {
                    embed.setTitle(lang.commands.topPlayed.title2, meantUser.avatarURL)
                }
                for(var i = 0; i < 10; i++) {
                if(topGames[i] && topGames[i].time / 1000 > 0) {
                    embed.addField(`${i + 1}. ${topGames[i].game}`, tools.convert.timeToString(topGames[i].time))
                }
                }
                return msg.edit(embed)
            })
        })
    })
}