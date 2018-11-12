function since(string) {
  if(!string) return string;
  string = string.toLowerCase()
  var formats = [
    "hour",
    "today",
    "day",
    "week",
    "month",
    "all",
    "always",
    "total"
  ]
  if(formats.indexOf(string) != -1) {
    return true;
  }
  var correctFormat = /^[0-9]{1,2}[mhdw]$/
  var tooMuchDigits = /^[0-9]{3,}[mhdw]$/
  if(correctFormat.test(string)) {
    return true;
  }
  if(tooMuchDigits.test(string)) {
    return -1
  }
  return false;
}
function mention(string) {
  if(!string) return false;
  var regex = /^<@[0-9]{18}>$/;
  var regex2 = /^<@![0-9]{18}>$/;
  return regex.test(string) || regex2.test(string)
}
function typeOf(string) {
  string = string.toLowerCase()
  var regex = /^<#[0-9]{18}>$/;
  if(regex.test(string)) return "textChannel"
  if(string == "true" || string == "false") return "boolean"
  if(!isNaN(string)) return "number"
  return "string"
}

module.exports = function(args, defaultGame, command) {
  if(command == "addrole") {
    var results = {wrongSyntax: false, defaultGame: false}
    args.forEach((currentArg, i) => {
      if(results.since) return;
      if(since(currentArg.split("/")[0]) && since(currentArg.split("/")[1])) {
        results.since = currentArg;
      } 
      if(args[i + 1]) {
        results.game = args.slice(i + 1, 25).join(" ")
      } else {
        results.game = defaultGame
        results.defaultGame = true;
      }
      if(arg.slice(0, i)) return results.role = arg.slice(0, 1).join(" ")

    })
    if(!results.role || !results.since) results.wrongSyntax = true;
    return results;
  }
  if(command == "setconfig") {
    var results = {wrongSyntax: false}
    if(!args[0] || !args[1]) results.wrongSyntax = true;
    results.key = args[0]
    results.value = args.slice(1).join(" ")
    results.type = typeOf(args.slice(1).join(" "))
    return results;
  }
  if(command == "serverstats") {
    var results = {wrongSyntax: false, gamesOnly: false, sortBy: "time"}
    var game = JSON.parse(JSON.stringify(args));
    args.forEach(arg => {
      function rm() {
        var i = game.indexOf(arg);
        if (i > -1) {
          game.splice(i, 1);
        }
      }
      if(/-?games\W?only|only\W?games/gmi.test(arg)) {
        results.gamesOnly = true;
        rm();
      }
      if(/-count/gmi.test(arg)) {
        results.sortBy = "count";
        rm();
      }
      if(/-time/gmi.test(arg)) {
        rm();
      }
    })
    if(game.length > 0) {
      results.game = game.join(" ");
    }
    return results;
  }
  var results = {wrongSyntax: false}
  var mentionIndex;
  var sinceIndex;
  args.forEach((arg, index) => {
    if(!results.since) {
      if(since(arg) == -1) results.since = -1; 
      if(since(arg) == true) results.since = arg.toLowerCase(); sinceIndex = index; 
    }
    if(!results.mention) {
      if(mention(arg)) results.mention = arg; mentionIndex = index;
    }
  })
  var otherText = args;
  otherText = otherText.map((e, index) => {
    return {arg: e, index: index}
  })
  if(results.since) otherText.splice(sinceIndex, 1)
  if(results.mention) {
    if(sinceIndex > mentionIndex) {
      otherText.splice(mentionIndex, 1)
    } else {
      otherText.splice(mentionIndex - 1, 1)
    }
  }
  otherText.forEach((e, index) => {
    if(otherText[index + 1] && otherText[index + 1].index != otherText[index].index + 1) {
      results.wrongSyntax = true;
    }
  })
  otherText = otherText.map(e => {return e.arg})
  if(otherText.length > 0) {
    results.other = otherText.join(" ");
    results.defaultGame = false;
  } else {
    results.other = defaultGame;
    results.defaultGame = true;
  }
  return results;
}