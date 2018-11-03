var tools = require("../tools")
var connection = tools.getConnection
module.exports = function(obj) {
    var message = obj.message;
    var lang = obj.lang;
    connection.query("SELECT count(*) FROM afk WHERE userID=?", [message.author.id], function(error, results, fields) {
        if(results[0]["count(*)"] > 0) {
            connection.query("DELETE FROM afk WHERE userID=?", [message.author.id], function(error, results, fields) {
                return message.reply(lang.commands.afk.toggleOff)
            })
        } else {
            connection.query("INSERT INTO afk (userID) VALUES (?)", [message.author.id], function(error, results, fields) {
                return message.reply(lang.commands.afk.toggleOn)
            })
        }
    })
}