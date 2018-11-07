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
            if(handledArgs.other && !handledArgs.defaultGame) return msg.edit(lang.commands.topPlayed.noGame.replace("%arg%", handledArgs.other))
            tools.topGames(meantUser.id, handledArgs.since, function(topGames, totalMS) {
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
                    embed.setTitle(lang.commands.topPlayed.titleCustomSince2.replace("%customSince%", tools.convert.secondsToTime(tools.convert.stringToSeconds(handledArgs.since))), meantUser.avatarURL)
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