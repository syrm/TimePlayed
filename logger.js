const Discord = require("discord.js");
const keys = require('./keys.json')
const token = keys.botToken;
const client = new Discord.Client({disableEveryone: true, autoReconnect:true, fetchAllMembers: true});
const tools = require('./tools')
var connection = require('./tools/connection.js');

connection.query("SELECT * FROM lastRefresh", function(err, results, fields) {
  if(err) throw err;
})

function clearup(callback) {
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

    connection.query(`UPDATE playtime SET endDate=? WHERE endDate IS NULL AND userID IN (?)`, [new Date(), toEnd], function(error, results, fields) {
      connection.query(`INSERT INTO playtime (userID, game, startDate) VALUES ?`, [toInsert], function(error, results, fields) {
        callback();
      })
    })
  })
}

function clearupGuildStats(callback) {
  connection.query(`SELECT * FROM guildStats WHERE endDate IS NULL`, function(error, results, fields) {
    var toEnd = [];
    var toInsert = [];
    results.forEach(result => {
      var user = client.users.get(result.userID);
      if(!user) return;
      if(!user.presence.game) {
        toEnd.push(user.id);
      } else if(user.presence.game.name != result.game) {
        toEnd.push(user.id);
        toInsert.push([user.id, result.guildID, user.presence.game.name, new Date()]);
      }
    })

    connection.query(`UPDATE guildStats SET endDate=? WHERE endDate IS NULL AND userID IN (?)`, [new Date(), toEnd], function(error, results, fields) {
      connection.query(`INSERT INTO guildStats (userID, guildID, game, startDate) VALUES ?`, [toInsert], function(error, results, fields) {
        callback();
      })
    })
  })
}

var premiumGuilds = [];
function updatePremiumGuilds() {
  // Check connection health
  connection.query("SELECT * FROM lastRefresh", function(err, results, fields) {
    if(err) {
      console.log("Database disconnected, retrying updatePremiumGuilds in 10 seconds")
      return setTimeout(updatePremiumGuilds, 5000);
    }
    // If connection is healthy
    connection.query("SELECT guildID FROM premium", function(error, results, fields) {
      if(!results) return;
      premiumGuilds = results.map(e => e.guildID);
      console.log("Premium list updated");
      setTimeout(updatePremiumGuilds, 3600000);
    })
  })
  
}
updatePremiumGuilds();

var toCheck = [];
function refresh() {
  // Check connection health
  connection.query("SELECT * FROM lastRefresh", function(err, results, fields) {
    if(err) {
      console.log("Database disconnected, retrying refresh in 10 seconds")
      return setTimeout(refresh, 5000);
    }
    // If connection is healthy
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
            console.log(`NM: ${oldMember.displayName} changed game (from ${oldMember.presence.game.name} to ${newMember.presence.game.name})`)
            toEnd.push(oldMember.id)
            toInsert.push([oldMember.id, date, newMember.presence.game.name])
          } else {
            // If started playing 
            console.log(`NM: ${oldMember.displayName} started playing ${newMember.presence.game.name}`)
            toInsert.push([oldMember.id, date, newMember.presence.game.name])
          }
        } else if(oldMember.presence.game) {
          // If stopped playing
          console.log(`NM: ${oldMember.displayName} stopped playing ${oldMember.presence.game.name}`)
          toEnd.push(oldMember.id)
        }
        if(oldMember.presence.status != newMember.presence.status && newMember.presence.status == "offline") {
          console.log(`NM: ${oldMember.displayName} went offline`)
          toLastOnline.push(oldMember.id)
        }
      })
  
      connection.query("UPDATE playtime SET endDate=? WHERE endDate IS NULL AND userID IN (?)", [new Date(), toEnd], function(error, results, fields) {
        connection.query("INSERT INTO playtime (userID, startDate, game) VALUES ?", [toInsert], function(error, results, fields) {
          connection.query("INSERT INTO lastOnline (userID, date) VALUES (?, ?) ON DUPLICATE KEY UPDATE date=?", [toLastOnline, new Date(), new Date()], function(error, results, fields) {
            connection.query("UPDATE lastRefresh SET date=NOW();", function(error, results, fields) {
              setTimeout(refresh, 5000)
              toCheck = []
            })
          })
        })
      })
    })
  })
}

var toCheckGuildStats = [];
function refreshGuildStats() {
  // Check connection health
  connection.query("SELECT * FROM lastRefresh", function(err, results, fields) {
    if(err) {
      console.log("Database disconnected, retrying guild stats refresh in 10 seconds")
      return setTimeout(refreshGuildStats, 5000);
    }
    // If connection is healthy
    var toInsert = [];
    var toEnd = [];
    toCheckGuildStats.forEach(arr => {
      var oldMember = arr[0];
      var newMember = arr[1];
      var guildID = arr[2];
      var date = arr[3];
      if(newMember.presence.game) {
        // If still playing a game

        // Return if game still same
        if(oldMember.presence.game && newMember.presence.game && oldMember.presence.game.name.toLowerCase() == newMember.presence.game.name.toLowerCase()) return;

        if(oldMember.presence.game) {
          // If game changed
          console.log(`GS: ${oldMember.displayName} changed game (from ${oldMember.presence.game.name} to ${newMember.presence.game.name} in ${guildID})`)
          toEnd.push(oldMember.id)
          toInsert.push([oldMember.id, guildID, date, newMember.presence.game.name])
        } else {
          // If started playing
          console.log(`GS: ${oldMember.displayName} started playing ${newMember.presence.game.name} (in ${guildID})`)
          toInsert.push([oldMember.id, guildID, date, newMember.presence.game.name])
        }
      } else if(oldMember.presence.game) {
        // If stopped playing
        console.log(`GS: ${oldMember.displayName} stopped playing ${oldMember.presence.game.name} (in ${guildID})`)
        toEnd.push(oldMember.id)
      }
    })

    connection.query("UPDATE guildStats SET endDate=? WHERE endDate IS NULL AND userID IN (?)", [new Date(), toEnd], function(error, results, fields) {
      connection.query("INSERT INTO guildStats (userID, guildID, startDate, game) VALUES ?", [toInsert], function(error, results, fields) {
        setTimeout(refreshGuildStats, 5000)
        toCheckGuildStats = []
      })
    })
  })
}

client.on("ready", () => {
  console.log("Client ready")
  console.log("Clearing up restart differences...");
  connection.query("SELECT date FROM lastRefresh ORDER BY date ASC", function(error, results, fields) {
    var date = results[0].date;
    var diffMs = (new Date() - date);
    var diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000);
    if(diffMins < 20 && diffMins >= 0) {
      clearup(function() {
        console.log("Regular clearup done")
        clearupGuildStats(function() {
          console.log("Guildstat clearup done");
          console.log("Started logging")
          refresh()
          refreshGuildStats()
        })
      })
    } else {
      console.log("Clearup cancelled (more than 20 minute difference), deleting invalid data")
      connection.query("DELETE FROM guildStats WHERE endDate IS NULL", function(error, results, fields) {
        connection.query("DELETE FROM playtime WHERE endDate IS NULL", function(error, results, fields) {
          console.log("Started logging")
          refresh()
          refreshGuildStats()
        })
      })
    }
  })
});

// For regular logging
client.on("presenceUpdate", (oldMember, newMember) => {
  if(oldMember.user.bot) return;

  // Only run once per user
  var sharedGuilds = client.guilds.filter(guild => {return guild.members.get(oldMember.id)}).keyArray()
  if(sharedGuilds.indexOf(oldMember.guild.id) != 0) return;

  toCheck.push([oldMember, newMember, new Date()])
})

// For server stats logging
client.on("presenceUpdate", (oldMember, newMember) => {
  if(oldMember.user.bot) return;
  var guild = oldMember.guild;

  // Return if guild isn't premium
  if(!keys.selfhost && !premiumGuilds.includes(guild.id)) return;
  // Return if same
  if(oldMember.presence.game && newMember.presence.game && oldMember.presence.game.name.toLowerCase() == newMember.presence.game.name.toLowerCase()) return;

  toCheckGuildStats.push([oldMember, newMember, guild.id, new Date()]);

})

client.on('error', function() {
  console.log("Discord connection failed")
});

client.login(token).catch(console.error);
