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

/*console.log("Clearing up invalid dates...");
connection.query("DELETE FROM playtime WHERE endDate IS NULL", function(error, results, fields) {
  if(error) throw error;
  console.log("Clearup done");
  dataReady();
})*/

var toCheck = []

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
      console.log(`${oldMember.displayName} changed game (from ${oldMember.presence.game.name} to ${newMember.presence.game.name})`)
      connection.query(`UPDATE playtime SET endDate=? WHERE userID=? AND game=? AND endDate IS NULL`, [date, oldMember.id, oldMember.presence.game.name], function(error, results, fields) {
        if(error) throw error;
      })
      connection.query(`INSERT INTO playtime (userID, game, startDate) VALUES ?`, [[[oldMember.id, newMember.presence.game.name, date]]], function(error, results, fields) {
        if(error) throw error;
      })
      removeAfk();
    } else {
      // Als hij begonnen is met spelen
      console.log(`${oldMember.displayName} started playing ${newMember.presence.game.name}`)
      connection.query(`INSERT INTO playtime (userID, game, startDate) VALUES ?`, [[[oldMember.id, newMember.presence.game.name, date]]], function(error, results, fields) {
        if(error) throw error;
      })
      removeAfk();
    }
  } else if(oldMember.presence.game) {
    // Als hij gestopt is met spelen
    console.log(`${oldMember.displayName} stopped playing ${oldMember.presence.game.name}`)
    connection.query(`UPDATE playtime SET endDate=? WHERE userID=? AND game=? AND endDate IS NULL`, [date, oldMember.id, oldMember.presence.game.name], function(error, results, fields) {
      if(error) throw error;
    })
    removeAfk();
  }
}

client.on("ready", () => {
  console.log("Ready!");
  refresh()
  console.log("Started logging")
  setInterval(refresh, 5000)
});

client.on("guildMemberRemove", member => {
  connection.query(`SELECT userID FROM startDates WHERE userID = ${member.id}`, function(err, results, fields) {
    if(err) throw err;
    if(results.length > 0) {
      var found = false;
      client.guilds.forEach(guild => {
        guild.members.forEach(currentMember => {
          if(currentMember.id == member.id) found = true;
        })
      })
      if(!found) {
        connection.query(`DELETE FROM startDates WHERE userID=${member.id}`, function(err) {
          if(err) throw err;
          console.log(`Stopped logging playtime for user (${member.user.tag}), deleted from start date table`)
        });
      }
    }
  });
})
client.on("presenceUpdate", (oldMember, newMember) => {
  if(oldMember.user.bot) return;
  var sharedGuilds = client.guilds.filter(guild => {return guild.members.get(oldMember.id)}).keyArray()
  if(sharedGuilds.indexOf(oldMember.guild.id) != 0) return;
  toCheck.push([oldMember, newMember, new Date()])
})

client.login(token);
