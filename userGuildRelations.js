const Discord = require("discord.js");
const keys = require('./keys.json')
const token = keys.realToken;
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
    /* connection.query("SELECT * FROM userGuilds ORDER BY userID LIMIT 5", function(error, results, fields) {
        // results = results.map(function(e) {return [e.userID, e.guildID]});
        userGuilds.forEach(function(obj) {
            
        })
        console.log(results);
        console.log(userGuilds);
        userGuilds.filter(function(e) {return results.includes(e)})
        console.log(userGuilds);
    }) */

    connection.query("DELETE FROM userGuilds", function(error, results, fields) {
    if(error) throw error;
        connection.query("INSERT INTO userGuilds (userID, guildID) VALUES ?", [userGuilds], function(error, results, fields) {
            if(error) throw error;
            console.log("User-guild relations updated")
        })
    })
})

client.login(token);