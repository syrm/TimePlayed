const tools = require("../tools");
const Discord = require("discord.js")
var connection = tools.getConnection;
module.exports = function(obj) {
    var message = obj.message;
    var client = obj.client;
    var lang = obj.lang;
    var meantUser = obj.meantUser;

    var presences = {
        dnd: ["do not disturb<:dnd:455385674749575168>", "#db2525"],
        idle: ["idle<:idle:455385674665951234>", "#e29b16"],
        online: ["online<:online:455385674762158110>", "0x00AE86"],
        offline: ["offline/invisible<:offline:455385675076730900>", "#8c8c8c"]
    }
    var types = ["playing", "streaming", "listening to", "watching"];
    
    var gameMessage;
    var game = ""
    if(!meantUser.presence.game) {
    gameMessage = lang.commands.status.noGame
    } else {
    lang = tools.replaceLang("%type%", types[meantUser.presence.game.type], lang);
    gameMessage = lang.commands.status.gamePlaying
    game = meantUser.presence.game.name;
    }
    
    var presence = presences[meantUser.presence.status][0]
    var embedColor = presences[meantUser.presence.status][1]
    
    function lastOnline(id, presence, callback) {
    if(presence.status != "offline") return callback("Right Now")
        connection.query(`SELECT * FROM lastOnline WHERE userID=${id}`, function(error, results, fields) {
        if(!results[0]) return callback("Not measured / Online since I got here", undefined);
        var str = tools.convert.timeDifference(results[0].date, new Date())
        str = str.charAt(0).toUpperCase() + str.slice(1)
        return callback(str + " (see footer for excact timestamp)", results[0].date)
        })
    }

    const embed = new Discord.RichEmbed()
    .setAuthor(lang.commands.status.title, client.user.avatarURL)
    .setColor(embedColor)
    .setDescription(lang.warnings.realityWarning)
    .addField("Presence", lang.commands.status.presence.replace("%presence%", presence))
    if(meantUser.presence.game && meantUser.presence.game.details) {
    embed.setThumbnail(`https://cdn.discordapp.com/app-assets/${meantUser.presence.game.applicationID}/${meantUser.presence.game.assets.largeImage}.png`)
    embed.addField("Game playing", `${gameMessage}:\n**${meantUser.presence.game.name}**\n${meantUser.presence.game.details}\n${meantUser.presence.game.state}`)
    } else {
    embed.addField("Game playing", `${gameMessage} **${game}**`)
    }
    lastOnline(meantUser.id, meantUser.presence, function(string, date) {
        if(meantUser.bot) game = undefined;
        tools.getThumbnail(game, function(thumbnail) {
            if(thumbnail && !embed.thumbnail) {
            embed.setThumbnail(thumbnail);
            } else if(!embed.thumbnail) {
            embed.setThumbnail(meantUser.avatarURL);
            } else if(game == "Spotify") {
            embed.setThumbnail(thumbnail);
            }
            embed.addField("Last Online", string)
            if(date) {
            embed.timestamp = date;
            embed.setFooter("Last online:")
            }
            message.channel.send({embed});
        })
    })
}