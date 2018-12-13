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

function clearup(table, callback) {
  connection.query(`SELECT * FROM ${table} WHERE endDate IS NULL`, function(error, results, fields) {
    var toEnd = [];
    results.forEach(result => {
      var user = client.users.get(result.userID);
      if(!user) return;
      if(!user.presence.game) {
        toEnd.push(user.id);
      } else if(user.presence.game.name != result.game) {
        toEnd.push(user.id);
        connection.query(`INSERT INTO ${table} (userID, game, startDate) VALUES (?, ?, ?)`, [user.id, user.presence.game.name, new Date()], function(error, results, fields) {})
      }
    })
    if(toEnd.length > 0) {
      connection.query(`UPDATE ${table} SET endDate=? WHERE userID IN (?)`, [new Date(), toEnd], function(error, results, fields) {
        setTimeout(function() {
          callback()
        }, 2000);
      })
    } else {
      setTimeout(function() {
        callback()
      }, 2000);
    }
  })
}

var toCheck = []
var premiumGuilds = [];
function updatePremiumGuilds() {
  connection.query("SELECT guildID FROM premium", function(error, results, fields) {
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
  console.log("Refreshing...")
  tools.filterTerms(toCheck, function(accepted) {
    accepted.forEach(arr => {
      lastOnline(arr[0], arr[1], arr[2])
      gameUpdate(arr[0], arr[1], arr[2], arr[3])
    })
    console.log(`Done, ${accepted.length} of the ${toCheck.length} accepted`)
    toCheck = []
  })
}

function lastOnline(oldMember, newMember, date) {
  if(oldMember.presence.status == newMember.presence.status || newMember.presence.status != "offline") return;
  connection.query(`SELECT * FROM lastOnline WHERE userID=?`, [oldMember.id], function(error, results, fields) {
    if(error) throw error;
    if(results.length < 1) {
      connection.query(`INSERT INTO lastOnline (userID, date) VALUES (?, ?)`, [oldMember.id, date], function(error, results, fields) {
        if(error) throw error;
      })
    } else {
      connection.query(`UPDATE lastOnline SET date=? WHERE userID=?`, [date, oldMember.id], function(error, results, fields) {
        if(error) throw error;
      })
    }
  })
}

function gameUpdate(oldMember, newMember, date, afk) {
  function removeAfk() {
    if(afk) {
      connection.query("DELETE FROM afk WHERE userID=?", [oldMember.id], function(error, results, fields) {
      })
    }
  }
  if(newMember.presence.game) {
    // Return if same
    if(oldMember.presence.game && newMember.presence.game && oldMember.presence.game.name.toLowerCase() == newMember.presence.game.name.toLowerCase()) return;
    // Als hij nog nu een game aan het spelen is
    if(oldMember.presence.game) {
      // Als de game veranderd is
      console.log(`Regular: ${oldMember.displayName} changed game (from ${oldMember.presence.game.name} to ${newMember.presence.game.name})`)
      connection.query(`UPDATE playtime SET endDate=? WHERE userID=? AND game=? AND endDate IS NULL`, [date, oldMember.id, oldMember.presence.game.name], function(error, results, fields) {
        if(error) throw error;
      })
      connection.query(`INSERT INTO playtime (userID, game, startDate) VALUES ?`, [[[oldMember.id, newMember.presence.game.name, date]]], function(error, results, fields) {
        if(error) throw error;
      })
      removeAfk();
    } else {
      // Als hij begonnen is met spelen
      console.log(`Regular: ${oldMember.displayName} started playing ${newMember.presence.game.name}`)
      connection.query(`INSERT INTO playtime (userID, game, startDate) VALUES ?`, [[[oldMember.id, newMember.presence.game.name, date]]], function(error, results, fields) {
        if(error) throw error;
      })
      removeAfk();
    }
  } else if(oldMember.presence.game) {
    // Als hij gestopt is met spelen
    console.log(`Regular: ${oldMember.displayName} stopped playing ${oldMember.presence.game.name}`)
    connection.query(`UPDATE playtime SET endDate=? WHERE userID=? AND game=? AND endDate IS NULL`, [date, oldMember.id, oldMember.presence.game.name], function(error, results, fields) {
      if(error) throw error;
    })
    removeAfk();
  }
}

client.on("ready", () => {
  console.log("Clearing up restart differences...");
  clearup("playtime", function() {
    console.log("Clearup done");
    console.log("Started logging")
    refresh()
    setInterval(refresh, 5000)
  })
});

client.on("guildMemberRemove", member => {
  connection.query(`SELECT userID FROM termsAccept WHERE userID = ?`, [member.id], function(err, results, fields) {
    if(err) throw err;
    if(results.length > 0) {
      var found = false;
      client.guilds.forEach(guild => {
        guild.members.forEach(currentMember => {
          if(currentMember.id == member.id) found = true;
        })
      })
      if(!found) {
        connection.query(`DELETE FROM termsAccept WHERE userID = ?`, [member.id], function(err) {
          connection.query(`DELETE FROM loggedUsers WHERE userID = ?`, [member.id], function(err) {
            console.log(`Stopped logging playtime for user (${member.user.tag}), deleted from start date table`)
          })
        })
      }
    }
  });
})
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
  if(!premiumGuilds.includes(guild.id)) return;
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
