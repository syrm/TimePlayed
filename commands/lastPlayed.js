var tools = require("../tools");
module.exports = function(obj) {
    var meantUser = obj.meantUser;
    var message = obj.message;
    var handledArgs = obj.handledArgs;
    var lang = obj.lang;
    tools.lastPlayed(meantUser.id, handledArgs.other, function(result) {
        if(result == -1) return message.channel.send(lang.commands.timePlayed.noPlaytime)
        if(meantUser.presence.game && meantUser.presence.game.name.toLowerCase() == handledArgs.other.toLowerCase()) return message.channel.send(lang.commands.lastPlayed.rightNow)
        return message.channel.send(lang.commands.lastPlayed.message.replace("%result%", tools.convert.timeDifference(result)))
    })
}