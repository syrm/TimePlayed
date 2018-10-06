const tools = require("../tools");
var connection = tools.getConnection;
module.exports = function(message, handledArgs) {
    connection.query("SELECT * FROM playtime WHERE userID=? AND game=?", [message.author.id, handledArgs.other], function(err, results, fields) {
    if(!results || results.length < 1) return message.reply(`You have never played \`${handledArgs.other}\`, so there's nothing to remove!\nIf you keep getting this error, please run the \`!!topPlayed\` command, and copy and paste the game's name to double check your spelling.`)
    message.channel.send(`Are you sure? This will delete **all** your \`${handledArgs.other}\` playtime data.\n⚠️This action can **not** be undone!⚠️\nTo confirm this action, react with the ✅ emoji.\nReact with ❌ to cancel this action`)
    .then(msg => {
        tools.awaitReaction(msg, ["✅", "❌"], message.author.id, function(reaction, choice) {
        if(choice == 1) return message.reply("Cancelled succesfully!")
        connection.query("DELETE FROM playtime WHERE userID=? AND game=?", [message.author.id, handledArgs.other], function(err, results, fields) {
            if(err) return message.reply(`Sorry, an unexpected error occured:\n\n\`${err}\`\nPlease report this error in the support server: <http://support.timeplayed.xyz>`)
            return message.reply(`Success! I've removed all your \`${handledArgs.other}\` data from my database.`)
        })
        })
    })
    })
}