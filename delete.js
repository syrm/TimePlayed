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
  // Approved
  // Collect array of users who need to be deleted
  console.log("Finding users where data needs to be saved from...")
  var accepted = []
  pool.getConnection(function(error, connection) {
    connection.query("SELECT * FROM termsAccept", function(error, results, fields) {
      if(error) throw error;
      results.forEach(result => {
        if(result.accept == 1) accepted.push(result.userID)
      })
      console.log(`Done, data of ${accepted.length} users`)
      // Actually delete them
      console.log(`Executing query...`)
      connection.query(`DELETE FROM playtime WHERE userID NOT IN (${connection.escape(accepted)})`, function(error, results, fields) {
        if(error) throw error;
        console.log(`Success, query affected ${results.affectedRows} rows`)
      })
    })
  })
});

client.on("message", message => {
  
})

client.login(token).catch(err => console.log(err))