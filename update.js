beta = false;

const keys = require('./keys.json');
const key = keys.imageAPIKeys;
var token;
if(beta == true) {
  token = keys.betaToken
} else {
  token = keys.botToken
}

// Require everything
const Discord = require("discord.js")

const client = new Discord.Client({disableEveryone: true, autoReconnect:true, fetchAllMembers: true});

client.on("ready", () => {
  client.user.setActivity(`${client.users.size} users | !!help`, { type: 'WATCHING' });
  console.log(`Bot is ready!`);
  console.log(`I'm in ${client.guilds.size} guilds.`)
  setInterval(() => {
    client.user.setActivity(`${client.users.size} users | !!help`, { type: 'WATCHING' });
  }, 60000)
  var count = 0;
  console.log("Fully started up!")
});

client.on("message", message => {
  var arr = []
  if(message.content.startsWith(`<@${client.id}>`) || arr.includes(message.content)) {
    return message.reply("Sorry, I'm currently not available because my database is being updated!")
  }

})

client.login(token).catch(err => console.log(err))