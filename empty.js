// Empty template version of the bot, used for testing special features or single database queries
beta = true;

const keys = require('./keys.json');
var connection = require('./tools/connection.js');
const key = keys.imageAPIKeys;
var token;
if(beta == true) {
  token = keys.betaToken
} else {
  token = keys.botToken
}

// Require everything
const Discord = require("discord.js")
const fs = require('fs');
const mysql = require("mysql")
const tools = require("./tools")
var pool = require('./tools/pool.js')

// Create client/stats poster
const client = new Discord.Client({disableEveryone: true, autoReconnect:true, fetchAllMembers: true});

client.on("ready", () => {
  console.log(`Bot is ready!`);
  
});

client.on("message", message => {
  function doSomething() {
    connection.query("SELECT * FROM playtime WHERE userID=112237401681727488", function(error, results, fields) {
      console.log(results.length);
    })
  }

  if(message.author.id == "112237401681727488" && message.content == "!!beta") {
    doSomething()
  }

  
})

client.login(token).catch(err => console.log(err))