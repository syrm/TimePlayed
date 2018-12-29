const tools = require("../tools");
const Discord = require("discord.js")
var version = require("../package.json").version
var connection = tools.getConnection;
module.exports = function(obj) {
    var message = obj.message;
    var lang = obj.lang;
    var client = obj.client;
    connection.query("SELECT COUNT(*) AS count FROM termsAccept", function(error, results, fields) {
        var userCount = results[0].count
        const embed = new Discord.RichEmbed()
        .setAuthor(`Bot info`, ``)
        .setThumbnail(client.user.avatarURL)
        .addField(`Users`, `I'm currently handling \`${client.users.size}\` users, and watching the playtime of \`${userCount}\` users`)
        .addField(`Guilds`, `I'm in \`${client.guilds.size}\` servers`)
        .addField(`Library`, `I'm powered by \`Discord.js v11.4.2\``, true)
        .addField(`Bot version`, `My current bot version is \`v${version}\``, true)
        if(!message.channel.type == "dm") embed.addField(`Joined at`, `I joined this server at \`${message.guild.joinedAt}\``)
        embed.addField(`Last restart`, `My last restart was \`${tools.convert.timeToString(client.uptime / 1000)}\` ago`)
        embed.addField(`Ping`, `My heartbeat is \`${client.ping}\`ms\nMy response time to this command was: \`measuring...\``)
        embed.addField(`Creator`, `I was created by <@112237401681727488> (@${client.users.get("112237401681727488").tag}), you can DM him whenever you need help with the bot`)
        embed.addField(`Useful links`, lang.commands.help.links)
        return message.channel.send(embed).then(res => {
            var num = 3;
            if(!message.channel.type == "dm") num = 4
            embed.fields[num].value = embed.fields[num].value.replace("measuring...", `${res.createdAt.getTime() - message.createdAt.getTime()}ms`)
            res.edit(embed)
        })
    })
}