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
  var regex = /^<@!?[0-9]{18}>$/;
  return regex.test(string)
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
  results.other = otherText.join(" ") || undefined;
  console.log(results)
  return results;
}