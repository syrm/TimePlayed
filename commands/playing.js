module.exports = function(message, handledArgs, lang) {
    var userArray = [];
    var stringCount = 0;
    var realCount = 0;
    var string = "";
    var morePeople = false;

    message.guild.members.forEach(function(user, id) {
    if(!user.presence.game || !user.presence.game.name) return;
    if(stringCount >= 20) {
        if(user.presence.game.name.toLowerCase() == handledArgs.other.toLowerCase()) {
        realCount ++;
        }
        morePeople = true;
        return;
    }
    if(user.presence.game.name.toLowerCase() == handledArgs.other.toLowerCase()) {
        string += `- ${user.user.tag}\n`
        realCount ++;
        stringCount ++;
    }
    })

    if(stringCount == 0) string = lang.commands.playing.noOne;
    if(stringCount == 1) string = lang.commands.playing.one + string;
    if(stringCount > 1) {
    string = lang.commands.playing.more.replace("%count%", stringCount) + string;
    }
    if(morePeople == true) {
    string += lang.commands.playing.moreThanTwenty.replace("%more%", realCount - stringCount)
    }
    string += `${lang.warnings.realityWarning}`;
    message.channel.send(string);
}