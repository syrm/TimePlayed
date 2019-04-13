var levenshtein = require("fast-levenshtein");
var tools = require("../tools")
var connection = require('../tools/connection.js');

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
    
        connection.query("SELECT game FROM gameAliases WHERE alias=?", [handledArgs.other], function(error, results, fields) {
            var bestMatch = {};
            if(results[0]) {
                // If an alias is found
                bestMatch.game = results[0].game
            } else {
                // If no alias is found
                // Make a list of unique server games
                var listGames = [];
                message.guild.members.forEach(member => {
                    if(!member.presence.game) return;
                    var game = member.presence.game.name
                    if(!listGames.includes(game)) listGames.push(game)
                })

                var matches = [];
                listGames.forEach(game => {
                    matches.push({game: game, distance: levenshtein.get(game, handledArgs.other)})
                })
                matches = matches.sort((a,b) => a.distance - b.distance)
                bestMatch = matches[0]
                
                if(matches[0].distance > 4) {
                    return message.channel.send(lang.commands.playing.noOne + lang.warnings.realityWarning)
                }
            }
            
            lang = tools.replaceLang(/%game%+/g, bestMatch.game, lang)

            message.guild.members.forEach(user => {
                if(!user.presence.game || !user.presence.game.name) return;
                if(stringCount >= 20) {
                    if(bestMatch.game.toLowerCase() == user.presence.game.name.toLowerCase()) {
                        realCount ++;
                    }
                    morePeople = true;
                    return;
                }
                if(bestMatch.game.toLowerCase() == user.presence.game.name.toLowerCase()) {
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
        })

       

        
    }
}