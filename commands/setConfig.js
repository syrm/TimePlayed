const tools = require("../tools");
var connection = tools.getConnection;
module.exports = function(message, handledArgs, lang) {
    if(message.member.hasPermission("ADMINISTRATOR")) {
        if(Object.keys(lang.commands.setConfig.availableValues).includes(handledArgs.key)) {
            if(handledArgs.key == "rankingChannel" || handledArgs.key == "enableRankingMentions" || handledArgs.key == "leaderboardAmount") {
                if(!premium) return message.reply(lang.errors.premiumOnly)
                if(handledArgs.key == "rankingChannel") {
                    var channelID = handledArgs.value.replace(/[<#>]+/g, "")
                    var channel = message.guild.channels.get(channelID)
                    if(channelID && !channel && handledArgs.value != "none") return message.reply(lang.commands.setConfig.noValidChannel)
                    var perms = [["VIEW_CHANNEL", "Read Messages"], ["SEND_MESSAGES", "Send Messages"], ["MANAGE_MESSAGES", "Manage Messages"]]
                    var missingPerm;
                    perms.forEach(perm => {
                        if(!message.guild.me.permissionsIn(channel).has(perm[0])) {
                            missingPerm = perm[1]
                        }
                    })
                    if(missingPerm) return message.reply(lang.commands.setConfig.noRankingPermissions.replace("%permission%", missingPerm).replace("%channel%", handledArgs.value))
                    handledArgs.value = channelID;
                }
            }
            var correctType = lang.commands.setConfig.availableValues[handledArgs.key]
            var wrongDataType = lang.commands.setConfig.wrongDataType.replace("%key%", handledArgs.key).replace("%type%", correctType)
            var types = {string: " (text)", number: "", boolean: " (true/false)", textChannel: " (mention a #channel)"}
            wrongDataType += `${types[correctType]}!`
            if(handledArgs.type != lang.commands.setConfig.availableValues[handledArgs.key]) return message.reply(wrongDataType)
            if(handledArgs.key == "leaderboardAmount" && Number(handledArgs.value) > 10) return message.reply(lang.commands.setConfig.moreThanTen)

            var value = handledArgs.value;
            if(value == "true") value = 1;
            if(value == "false") value = 0;
            connection.query(`UPDATE guildSettings SET ${handledArgs.key}=? WHERE guildID=?`, [value, message.guild.id], function(err, results, fields) {
                if(err) return message.reply(`Error: ${err}`)
                return message.reply(lang.commands.setConfig.success.replace("%key%", handledArgs.key).replace("%value%", handledArgs.value));
            })
            
        } else if(handledArgs.key == "roleAwards") {
            return message.reply(lang.commands.setConfig.roleAwards);
        } else {
            var availableSettings = ""
            Object.keys(lang.commands.setConfig.availableValues).forEach(key => {
            var type = lang.commands.setConfig.availableValues[key]
            availableSettings += `\`${key}\` (${type})\n`
            })
            return message.reply(lang.commands.setConfig.unknownSetting.replace("%availableSettings%", availableSettings))
        }
    } else {
        message.reply(lang.errors.noPermission)
    }
}