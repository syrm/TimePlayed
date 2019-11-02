var tools = require("../tools")
module.exports = function(obj) {
  var message = obj.message;
  var lang = obj.lang;
  tools.termsCheck(message.author.id, message.author.id, function(accept) {
    if(accept.executer) {
      return message.reply("It seems like you already accepted to my terms of service! If you are having trouble logging your playtime, please contact support.")
    } else {
      tools.setTerms(message.author.id, true, function() {
        return message.reply(lang.general.termsAccepted)
      })
    }
  })
}