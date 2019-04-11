const Discord = require("discord.js");
const keys = require('./keys.json')
const token = keys.botToken;
const client = new Discord.Client({disableEveryone: true, autoReconnect:true, fetchAllMembers: true});
var connection = require('./tools/connection.js');

client.on("ready", () => {
    console.log("Updating user-guild relations...")
    var userGuilds = [];
    client.guilds.forEach(guild => {
        guild.members.forEach(member => {
            userGuilds.push([member.id, guild.id])
        })
    })
    connection.query("DELETE FROM userGuilds", function(error, results, fields) {
    if(error) throw error;
        connection.query("INSERT INTO userGuilds (userID, guildID) VALUES ?", [userGuilds], function(error, results, fields) {
            if(error) throw error;
            console.log("User-guild relations updated")
        })
    })
})

client.login(token);