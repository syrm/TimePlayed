const fs = require('fs');
const token = 'NDM3OTY5OTY5NTkwOTYwMTM4.Db9y2g.-MFlUxfUZg5wv0SznnHNnUNftnk';
const Discord = require("discord.js");
const client = new Discord.Client({disableEveryone: true, autoReconnect:true});
const prefix = "!"
var pool = require('./tools/pool.js')

Array.prototype.clean = function(deleteValue) {
  for (var i = 0; i < this.length; i++) {
    if (this[i] == deleteValue) {
      this.splice(i, 1);
      i--;
    }
  }
  return this;
};

function checkPremium() {
  var supportServer = client.guilds.find(x => x.id === "433531223244013572")
  supportServer.members.forEach(function(member){
    if(member.roles.find(x => x.name === "TimePlayed Premium💛")) {
      if(fs.existsSync(`./data/premiumUsers/${member.user.id}.txt`) == false) {
        supportServer.channels.get("433631612991963136").send(`<@${member.user.id}>, I see you're a TimePlayed Premium supporter! Go type \`!addPremium (server ID)\` in this channel to claim your premium features!`)
        fs.appendFileSync(`./data/premiumUsers/${member.user.id}.txt`, ``)
        console.log(`Found new user (${member.user.tag}), added to the list and message sent`)
      }
    } else {
      if(fs.existsSync(`./data/premiumUsers/${member.user.id}.txt`)) {
        fs.unlinkSync(`./data/premiumUsers/${member.user.id}.txt`)
        supportServer.channels.get('433631612991963136').send(`<@${member.user.id}>, I see you're not a donator anymore, so I removed your premium features :slight_frown:\nAnyway, thanks for the support you gave!`)
        console.log(`Removed user (${member.user.tag}) from the premium list.`)
      }
    }
  })
  console.log("Checked for premium users.")
}

client.on("ready", () => {
  client.user.setActivity(`for donators`, { type: 'WATCHING' });
  console.log(`Bot is ready!`);
  setInterval(checkPremium, 600000)
  checkPremium()
});

client.on("message", message => {
  if(message.author.bot) {return;}
  if(message.channel.type == "dm" || message.channel.type == "group") {
    return message.reply("Sorry, I'm not available in PM channels, please run my commands in the TimePlayed Support Server.")
  }
  var command = message.content.replace(prefix, "").split(" ")[0].toLowerCase();
  var arg = message.content.replace(prefix + message.content.replace(prefix, "").split(" ")[0], "").split(" ").clean("");

  if(command === "addpremium") {
    if(fs.existsSync(`./data/premiumUsers/${message.author.id}.txt`) == false) {
      return message.reply("You can only add/remove a premium server when you're a donator! Become a patron at <https://www.patreon.com/TimePlayed>")
    } else {
      if(fs.readFileSync(`./data/premiumUsers/${message.author.id}.txt`) == '') {
        if(arg[0]) {
          if(isNaN(arg[0]) || arg[0].length != 18) {
            return message.reply(`Please provide the ID of the server you want to add (18 numbers long)`)
          } else {
            fs.appendFileSync(`./data/premiumUsers/${message.author.id}.txt`, arg[0])
            return message.reply('Added that server to the premium list succesfully!')
          }
        }
      } else {
        return message.reply('You can only add 1 premium server! Use \`!removePremium\` to remove your server from the premium list.')
      }
    }
  }

  if(command === "removepremium") {
    if(fs.existsSync(`./data/premiumUsers/${message.author.id}.txt`) == false) {
      return message.reply("You can only add/remove a premium server when you're a donator! Become a donator at https://www.patreon.com/TimePlayed")
    } else {
      if(fs.readFileSync(`./data/premiumUsers/${message.author.id}.txt`) == '') {
        return message.reply('You don\'t have a premium server assigned, so there\'s nothing to remove! Use \`!addPremium (server ID)\` to add a premium server.')
      } else {
        fs.writeFileSync(`./data/premiumUsers/${message.author.id}.txt`, ``)
        return message.reply('Removed your guild from the premium list succesfully! You can now add a new one by typing \`!addPremium (server ID)\`')
      }
    }
  }

  var valid = false;

  function deleteByID(iconID) {
    pool.getConnection(function(error, connection) {
      connection.query(`SELECT messageID FROM gameIcons WHERE ID=?`, [iconID], function(error, results, fields) {
        if(results[0]) {
          message.channel.fetchMessage(results[0].messageID).then(msg => {
            msg.delete(3000)
          })
        }
        connection.query("UPDATE gameIcons SET messageID=NULL, userID=NULL WHERE ID=?", [iconID], function(error, results, fields) {
          connection.release()
        })
      })
    })
  }

  if(command === "assign" || command === "approve") {
    valid = true;
    if(message.channel.id != "475001642870374410") return message.reply("Please run this command in the <#475001642870374410> channel!").then(msg => {msg.delete(2000); message.delete(2000)})
    if(!arg[0]) return message.reply("Please provide an icon ID!").then(msg => {msg.delete(2000); message.delete(2000)})
    if(!arg[1]) return message.reply("Please provide a link with an icon of the ID!").then(msg => {msg.delete(2000); message.delete(2000)})
    pool.getConnection(function(error, connection) {
      connection.query(`SELECT iconURL FROM gameIcons WHERE ID=?`, [arg[0]], function(error, results, fields) {
        if(results.length > 0) {
          if(results[0].iconURL) return message.reply("That game has already been assigned to an image!").then(msg => {msg.delete(2000); message.delete(2000);})
          connection.query(`UPDATE gameIcons SET iconURL=? WHERE ID=?`, [arg[1], arg[0]], function(error, results2, fields) {
            connection.release()
            message.reply("Icon assigned to game!").then(msg => {msg.delete(2000); message.delete(2000);})
            return deleteByID(arg[0]);
          })
        } else {
          connection.release()
          return message.reply(`Invalid ID: \`${arg[0]}\``).then(msg => {msg.delete(2000); message.delete(2000)})
        }
      })
    })
  }

  if(command === "delete" || command === "decline") {
    valid = true;
    if(message.channel.id != "475001642870374410") return message.reply("Please run this command in the <#475001642870374410> channel!").then(msg => {msg.delete(2000); message.delete(2000)})
    if(!arg[0]) return message.reply("Please provide an icon ID!").then(msg => {msg.delete(2000); message.delete(2000)})
    pool.getConnection(function(error, connection) {
      connection.query(`SELECT iconURL FROM gameIcons WHERE ID=?`, [arg[0]], function(error, results, fields) {
        if(results.length > 0) {
          connection.query(`UPDATE gameIcons SET blocked=1 WHERE ID=?`, [arg[0]], function(error, results2, fields) {
            connection.release()
            message.reply("Icon request deleted").then(msg => {msg.delete(2000); message.delete(2000);})
            return deleteByID(arg[0]);
          })
        } else {
          connection.release()
          return message.reply(`Invalid ID: \`${arg[0]}\``).then(msg => {msg.delete(2000); message.delete(2000)})
        }
      })
    })
  }

  if(message.channel.id == "475001642870374410" && !valid) message.delete()
})

client.login(token);
