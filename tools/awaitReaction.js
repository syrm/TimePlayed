module.exports = async function(msg, emojis, userID, callback) {
    for(i = 0; i < emojis.length; i++) {
      await msg.react(emojis[i]).catch(err => console.log("No permission to add reaction"))
    }
    const filter = (reaction, user) => emojis.includes(reaction.emoji.toString()) && user.id != "433625399398891541"
    const collector = msg.createReactionCollector(filter);
    collector.on('collect', (reaction, user) => {
      user = reaction.users.last()
      if(userID && user.id != userID) return;
      callback(reaction.emoji, emojis.indexOf(reaction.emoji.toString()), user)
      collector.stop()
    })
}