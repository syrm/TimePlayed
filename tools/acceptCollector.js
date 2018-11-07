var tools = require('./index.js')
module.exports = function(acceptMessage) {
    const filter = (reaction, user) => reaction.emoji.toString() == "✅" && reaction.message.content.startsWith("​​​​") && reaction.message.author.id == "433625399398891541" && user.id != "433625399398891541"
    const collector = acceptMessage.createReactionCollector(filter);
    collector.on('collect', (reaction, user) => {
      user = reaction.users.last()
      tools.setTerms(user.id, true, function() {
        reaction.message.channel.send(`<@${user.id}> Success!`).then(msg => {msg.delete(2000)})
      })
    })
  }