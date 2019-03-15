const Discord = require("discord.js");
const keys = require('./keys.json')
const token = keys.botToken;
const client = new Discord.Client({disableEveryone: true, autoReconnect:true, fetchAllMembers: true});
const mysql = require("mysql")
const tools = require('./tools')
var connection = mysql.createConnection({
  host: keys.mysqlhost,
  user: keys.mysqlusername,
  password: keys.mysqlpasswd,
  database: 'timeplayed',
  supportBigNumbers: true,
  charset: 'utf8mb4'
});
connection.connect();

function clearup(callback) {
  connection.query("DELETE FROM guildStats WHERE endDate IS NULL", function(error, results, fields) {
    connection.query(`SELECT * FROM playtime WHERE endDate IS NULL`, function(error, results, fields) {
      var toEnd = [];
      var toInsert = [];
      results.forEach(result => {
        var user = client.users.get(result.userID);
        if(!user) return;
        if(!user.presence.game) {
          toEnd.push(user.id);
        } else if(user.presence.game.name != result.game) {
          toEnd.push(user.id);
          toInsert.push([user.id, user.presence.game.name, new Date()]);
        }
      })
      if(toEnd.length > 0 && toInsert.length > 0) {
        connection.query(`UPDATE playtime SET endDate=? WHERE userID IN (?)`, [new Date(), toEnd], function(error, results, fields) {
          connection.query(`INSERT INTO playtime (userID, game, startDate) VALUES ?`, [toInsert], function(error, results, fields) {
            callback()
          })
        })
      } else if(toEnd.length > 0) {
        connection.query(`UPDATE playtime SET endDate=? WHERE endDate IS NULL AND userID IN (?)`, [new Date(), toEnd], function(error, results, fields) {
          callback()
        })
      } else if(toInsert.length > 0) {
        connection.query(`INSERT INTO playtime (userID, game, startDate) VALUES ?`, [toInsert], function(error, results, fields) {
          callback()
        })
      } else {
        callback();
      }
    })
  })
}

var toCheck = []
var premiumGuilds = [];
function updatePremiumGuilds() {
  connection.query("SELECT guildID FROM premium", function(error, results, fields) {
    if(!results) return;
    premiumGuilds = [];
    results.forEach(result => {
        premiumGuilds.push(result.guildID);
    })
    console.log("Premium list updated");
  })
}
updatePremiumGuilds();
setInterval(updatePremiumGuilds, 60000);

function refresh() {
  tools.filterTerms(toCheck, function(accepted) {
    var toInsert = [];
    var toEnd = [];
    var toLastOnline = [];
    accepted.forEach(arr => {
      var oldMember = arr[0];
      var newMember = arr[1];
      var date = arr[2];
      if(newMember.presence.game) {
        // Return if game still the same
        if(oldMember.presence.game && newMember.presence.game && oldMember.presence.game.name.toLowerCase() == newMember.presence.game.name.toLowerCase()) return;
        // If still playing a game
        if(oldMember.presence.game) {
          // If game changed
          console.log(`${oldMember.displayName} changed game (from ${oldMember.presence.game.name} to ${newMember.presence.game.name})`)
          toEnd.push(oldMember.id)
          toInsert.push([oldMember.id, date, newMember.presence.game.name])
        } else {
          // If started playing 
          console.log(`${oldMember.displayName} started playing ${newMember.presence.game.name}`)
          toInsert.push([oldMember.id, date, newMember.presence.game.name])
        }
      } else if(oldMember.presence.game) {
        // If stopped playing
        console.log(`${oldMember.displayName} stopped playing ${oldMember.presence.game.name}`)
        toEnd.push(oldMember.id)
      }
      if(oldMember.presence.status != newMember.presence.status && newMember.presence.status == "offline") {
        console.log(`${oldMember.displayName} went offline`)
        toLastOnline.push(oldMember.id)
      }
    })

    connection.query("UPDATE playtime SET endDate=? WHERE endDate IS NULL AND userID IN (?)", [new Date(), toEnd], function(error, results, fields) {
      connection.query("INSERT INTO playtime (userID, startDate, game) VALUES ?", [toInsert], function(error, results, fields) {
        connection.query("INSERT INTO lastOnline (userID, date) VALUES (?, ?) ON DUPLICATE KEY UPDATE date=?", [toLastOnline, new Date(), new Date()], function(error, results, fields) {
          setTimeout(refresh, 5000)
        })
      })
    })
    toCheck = []
  })
}

client.on("ready", () => {
  console.log("Clearing up restart differences...");
  clearup(function() {
    console.log("Clearup done");
    console.log("Started logging")
    refresh()
  })
});

// For regular logging
client.on("presenceUpdate", (oldMember, newMember) => {
  if(oldMember.user.bot) return;

  var sharedGuilds = client.guilds.filter(guild => {return guild.members.get(oldMember.id)}).keyArray()
  if(sharedGuilds.indexOf(oldMember.guild.id) != 0) return;
  toCheck.push([oldMember, newMember, new Date()])
})

// For server stats logging
client.on("presenceUpdate", (oldMember, newMember) => {
  if(oldMember.user.bot) return;
  var guild = oldMember.guild;
  var date = new Date();
  // Return if guild isn't premium
  if(!keys.selfhost && !premiumGuilds.includes(guild.id)) return;
  // Return if same
  if(oldMember.presence.game && newMember.presence.game && oldMember.presence.game.name.toLowerCase() == newMember.presence.game.name.toLowerCase()) return;
  if(newMember.presence.game) {
    // Als hij nog nu een game aan het spelen is
    if(oldMember.presence.game) {
      // Als de game veranderd is
      console.log(`guildStats: ${oldMember.displayName} changed game (from ${oldMember.presence.game.name} to ${newMember.presence.game.name})`)
      connection.query(`UPDATE guildStats SET endDate=? WHERE guildID=? AND userID=? AND game=? AND endDate IS NULL`, [date, guild.id, oldMember.id, oldMember.presence.game.name, guild.id], function(error, results, fields) {
        if(error) throw error;
      })
      connection.query(`INSERT INTO guildStats (guildID, userID, game, startDate) VALUES ?`, [[[guild.id, oldMember.id, newMember.presence.game.name, date]]], function(error, results, fields) {
        if(error) throw error;
      })
    } else {
      // Als hij begonnen is met spelen
      console.log(`guildStats: ${oldMember.displayName} started playing ${newMember.presence.game.name}`)
      connection.query(`INSERT INTO guildStats (guildID, userID, game, startDate) VALUES ?`, [[[guild.id, oldMember.id, newMember.presence.game.name, date]]], function(error, results, fields) {
        if(error) throw error;
      })
    }
  } else if(oldMember.presence.game) {
    // Als hij gestopt is met spelen
    console.log(`guildStats: ${oldMember.displayName} stopped playing ${oldMember.presence.game.name}`)
    connection.query(`UPDATE guildStats SET endDate=? WHERE guildID=? AND userID=? AND game=? AND endDate IS NULL`, [date, guild.id, oldMember.id, oldMember.presence.game.name], function(error, results, fields) {
      if(error) throw error;
    })
  }
})

client.login(token);
