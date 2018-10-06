const tools = require("../tools");
var connection = tools.getConnection;
function requestIcon(game, requesterID, requesterTag) {
    connection.query("SELECT * FROM gameIcons WHERE game=?", [game], function(error, results, fields) {
        var error = false;
        results.forEach(result => {
        if(result.game.toLowerCase() == game.toLowerCase()) {
            error = true;
            return;
        }
        })
        if(error) return;
        connection.query(`INSERT INTO gameIcons (game, userID) VALUES (?, ?)`, [game, requesterID], function(error, results, fields) {
        client.channels.get("475001642870374410").send(`Icon requested, status: awaiting response\nGame name: \`${game}\`\nRequested by: \`${requesterTag}\`\nType \`!assign ${results.insertId} (iconURL)\` to approve, or \`!delete ${results.insertId}\` to delete/ignore.`).then(msg => {
            connection.query("UPDATE gameIcons SET messageID=? WHERE ID=?", [msg.id, results.insertId], function(error, results, fields) {
            return;
            })
        })
        })
    })
}

module.exports = function(game, callback) {
    if(!game || game == "") return callback(undefined);
    connection.query("SELECT * FROM gameIcons WHERE game=? AND blocked IS NOT NULL", [game], function(error, results, fields) {
      if(results.length > 0) {
        return callback(results[0].iconURL)
      } else {
        callback(undefined)
        return requestIcon(game, undefined, "Client (automated request)")
      }
    })
  }