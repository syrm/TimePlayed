// Empty template version of the bot, used for testing special features or single database queries
beta = false;

const keys = require('./keys.json');
const key = keys.imageAPIKeys;
var token;
if(beta == true) {
  token = keys.betaToken
} else {
  token = keys.botToken
}
var realityWarning = `Please realize that this information is **based on Discord presences** and it can deviate from reality.`

// Require everything
const Discord = require("discord.js")
const fs = require('fs');
const mysql = require("mysql")
const tools = require("./tools")
const en = require('./lang/en.json')
const DBL = require("dblapi.js")
var pool = require('./tools/pool.js')

// Create client/stats poster
const client = new Discord.Client({disableEveryone: true, autoReconnect:true, fetchAllMembers: true});

client.on("ready", () => {
  console.log(`Bot is ready!`);
});

client.on("message", message => {
  if(message.author.id == 112237401681727488 && message.content == "??send") {
    function sendMessage(i) {
      if(!i) i = 0;
      if(i < client.guilds.size) {
        var noSend = false;
        var guild = client.guilds.array()[i]
        if(guild.id == "264445053596991498" || guild.id == "110373943822540800") {
          noSend = true;
          console.log("Canceled")
        }
        var d = new Date();
        d.setDate(d.getDate()-7);
       if(guild.joinedAt > d) {
          noSend = true;
          console.log("Canceled");
        }
        var found = false;
        guild.channels.forEach(function(channel, id) {
          if(!found && channel.type == "text" && !noSend) {
            if(guild.me.permissionsIn(channel).has("SEND_MESSAGES") && guild.me.permissionsIn(channel).has("VIEW_CHANNEL")) {
              found = true;
              channel.send(`**Important Notice:**\nYou might have noticed my new Terms of Service, they are in the bot for a week. In 3 days, on **August 10 2018**, I will stop logging playtime of users who haven't accepted to these terms. I will also **delete ALL data from EVERYONE who hasn't accepted to these terms**.\nSo if you know anyone who doesn't want to lose their playtime data, please ask them to accept to the terms by running any of my commands.\nFeel free to delete this message if unrelevant.`)
            }
          }
        })
        console.log("sent " + i)
        i++
        setTimeout(function() { sendMessage(i) }, 5000)
      }
    }
    sendMessage(0)
  }
})

client.login(token).catch(err => console.log(err))