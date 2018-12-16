const tools = require("../tools");
var connection = tools.getConnection;
module.exports = function(game, callback) {
    connection.query("SELECT iconURL, color FROM knownGames WHERE game=? AND iconURL IS NOT NULL", [game], function(error, results, fields) {
        console.log(error);
        if(results.length > 0) {
            return callback(results[0].iconURL, results[0].color)
        } else {
            callback()
        }
    })
}