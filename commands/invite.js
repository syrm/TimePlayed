module.exports = function(obj) {
    var message = obj.message;
    var lang = obj.lang;
    message.channel.send(lang.commands.invite.msg)
}