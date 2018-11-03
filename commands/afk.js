var tools = require("../tools")
var connection = tools.getConnection
module.exports = function(obj) {
    var message = obj.message;
    var lang = obj.lang;
    connection.query("SELECT * FROM afk WHERE userID=?", [message.author.id], function(error, results, fields) {
        if(results.length > 0) {
            // If user is AFK
            connection.query("DELETE FROM afk WHERE userID=?", [message.author.id], function(error, results, fields) {
                if(message.author.presence.game) {
                    connection.query("INSERT INTO playtime (userID, game, startDate) VALUES (?, ?, ?)", [message.author.id, message.author.presence.game.name, new Date()], function(error, results, fields) {
                        return message.reply(lang.commands.afk.toggleOff)
                    })
                } else {
                    return message.reply(lang.commands.afk.toggleOff)
                }
            })
        } else {
            // If user is not AFK
            connection.query("INSERT INTO afk (userID) VALUES (?)", [message.author.id], function(error, results, fields) {
                connection.query(`UPDATE playtime SET endDate=? WHERE userID=? AND endDate IS NULL`, [new Date(), message.author.id], function(error, results, fields) {
                    return message.reply(lang.commands.afk.toggleOn);
                })
            })
        }
    })
}