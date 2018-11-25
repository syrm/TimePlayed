module.exports = function(obj) {
    var message = obj.message;
    var lang = obj.lang;
    var handledArgs = obj.handledArgs;
    var guildConf = obj.guildConf;
    
    if(handledArgs.defaultGame) {
        var games = [];
        message.guild.members.forEach(user => {
            if(user.user.bot || !user.presence.game || !user.presence.game.name) return;
            if(games.some(e => {return e.game.toLowerCase() == user.presence.game.name.toLowerCase()})) {
                var i = games.map(e => {return e.game.toLowerCase()}).indexOf(user.presence.game.name.toLowerCase())
                games[i].players++;
            } else {
                games.push({game: user.presence.game.name, players: 1})
            }
        })
        games.sort((a, b) => {return b.players - a.players})

        var string = "**The currently most played games in this server are:**\n";
        games.forEach((obj, i) => {
            if(i > 10) return;
            var s = "s";
            if(obj.players < 2) s = "";
            string += `- ${obj.game} (${obj.players} player${s})\n`
        })
        string += `Type \`${guildConf.prefix}playing (game)\` to get a list of users playing a game.`
        return message.channel.send(string);
    } else {
        var stringCount = 0;
        var realCount = 0;
        var string = "";
        var morePeople = false;
    
        message.guild.members.forEach(user => {
            if(!user.presence.game || !user.presence.game.name) return;
            if(stringCount >= 20) {
                if(user.presence.game.name.toLowerCase() == handledArgs.other.toLowerCase()) {
                realCount ++;
                }
                morePeople = true;
                return;
            }
            if(user.presence.game.name.toLowerCase() == handledArgs.other.toLowerCase()) {
                string += `- ${user.user.tag}\n`
                realCount ++;
                stringCount ++;
            }
        })
    
        if(stringCount == 0) string = lang.commands.playing.noOne;
        if(stringCount == 1) string = lang.commands.playing.one + string;
        if(stringCount > 1) {
        string = lang.commands.playing.more.replace("%count%", stringCount) + string;
        }
        if(morePeople == true) {
        string += lang.commands.playing.moreThanTwenty.replace("%more%", realCount - stringCount)
        }
        string += lang.warnings.realityWarning;
        return message.channel.send(string);
    }
}