var tools = require("../tools")
module.exports = function(obj) {
  var message = obj.message;
  var lang = obj.lang;
  tools.setTerms(message.author.id, true, function() {
    return message.reply(lang.general.termsAccepted)
  })
}