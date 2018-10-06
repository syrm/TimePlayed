const tools = require("../tools");
const Discord = require("discord.js")
module.exports = function(message, client, lang) {
    const embed = new Discord.RichEmbed()
        .setAuthor(`Bot info`, ``)
        .setThumbnail(client.user.avatarURL)
        .addField(`Users`, `I'm currently handling \`${client.users.size}\` users`, true)
        .addField(`Guilds`, `I'm in \`${client.guilds.size}\` servers`, true)
        if(!message.channel.type == "dm") embed.addField(`Joined at`, `I joined this server at \`${message.guild.joinedAt}\``, true)
        embed.addField(`Last restart`, `My last restart was at \`${client.readyAt}\``, true)
        embed.addField(`Ping`, `My response time to you is: \`measuring...\``)
        embed.addField(`Creator`, `I was created by <@112237401681727488> (@xVaql#4581)`, true)
        embed.addField(`Useful links`, lang.commands.help.links)  
        return message.channel.send(embed).then(msg => {
            var num = 3;
            if(!message.channel.type == "dm") num = 4
            embed.fields[num].value = embed.fields[num].value.replace("measuring...", `${msg.createdAt.getTime() - message.createdAt.getTime()}ms`)
            msg.edit(embed)
        })
}