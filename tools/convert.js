module.exports.timeToString =  function(num) {
  num = Number(num) / 1000
  if(num < 0) return n;
  if(num == 0) return "no"

  var hours = Math.floor(num / 3600);
  var minutes = Math.floor(num % 3600 / 60);
  var seconds = Math.floor(num % 3600 % 60);
  
  var h = ""
  if(hours == 1) h = "1 hour"
  if(hours > 1) h = `${hours} hours`
  var m = ""
  if(minutes == 1) m = "1 minute"
  if(minutes > 1) m = `${minutes} minutes`
  var s = ""
  if(seconds == 1) s = "1 second"
  if(seconds > 1) s = `${seconds} seconds`

  var comma1 = "";
  if(hours > 0 && minutes > 0) comma1 = ", "
  var comma2 = "";
  if(minutes > 0 && seconds > 0) comma2 = ", "
  if(hours > 0 && seconds > 0) comma2 = ", "

  var str = h + comma1 +  m + comma2 + s
  var pos = str.lastIndexOf(',');
  if(pos > 0) {
    str = str.substring(0,pos) + " and" + str.substring(pos+1)
  }
  
  return str
}
module.exports.sinceDate = function(since) {
  if(since instanceof Date) return since;
  if(!isNaN(since)) {
    var d = new Date();
    d.setMinutes(d.getMinutes() - since);
    return d;
  }

  var d = new Date();
  if(since == "all" || since == "always" || since == "total" || typeof since != "string") {
    return new Date("January 01, 1970 00:00:00");
  }
  if(since == "today" || since == "day") {
    d.setHours(6);
    d.setMinutes(0);
    d.setSeconds(0);
    d.setMilliseconds(0)
    return d;
  }
  if(since == "week") {
    d.setDate(d.getDate() - 7);
    return d;
  }
  if(since == "month") {
    d.setDate(d.getDate() - 30);
    return d;
  }
  if(since == "hour") {
    d.setDate(d.getHours() - 1)
    return d;
  }
  var num = Number(since.substring(0, since.length - 1))
  if(since.endsWith("m")) {
    d.setMinutes(d.getMinutes() - num);
  }
  if(since.endsWith("h")) {
    d.setHours(d.getHours() - num);
  }
  if(since.endsWith("d")) {
    d.setDate(d.getDate() - num);
  }
  if(since.endsWith("w")) {
    d.setDate(d.getDate() - num * 7);
  }
  return d;
}
module.exports.ordinalSuffix = function(i) {
  var j = i % 10,
      k = i % 100;
  if (j == 1 && k != 11) {
      return i + "st";
  }
  if (j == 2 && k != 12) {
      return i + "nd";
  }
  if (j == 3 && k != 13) {
      return i + "rd";
  }
  return i + "th";
}
module.exports.sinceToString = function(since, simpleLayout, first) {
  var num = Number(since.substring(0, since.length - 1))
  var prefix;
  var suffix;
  if(isNaN(num)) {
    suffix = since;
  }
  if(since.endsWith("m")) {
    suffix = "minute"
    prefix = "In"
  }
  if(since.endsWith("h")) {
    suffix = "hour"
    prefix = "In"
  }
  if(since.endsWith("d")) {
    suffix = "day"
    prefix = "In"
  }
  if(since.endsWith("w")) {
    suffix = "week"
    prefix = "In"
  }
  if(since == "today") {
    return `Today`
  }
  if(since == "always" || since == "all" || since == "total") {
    return `In total`
  }
  if(since == "week") return `In the last 7 days`

  if(num > 1) {
    suffix += "s"
  }
  if(simpleLayout == true) {
    if(num > 1 || first == true) {
      return `${num} ${suffix}`
    } else {
      return suffix;
    }
  } else {
    if(num > 1) {
      return `${prefix} the last ${num} ${suffix}`
    } else {
      return `${prefix} the last ${suffix}`
    }
    
  }
  
  
}
module.exports.MSToDays = function(t){
  var cd = 24 * 60 * 60 * 1000,
      ch = 60 * 60 * 1000,
      d = Math.floor(t / cd),
      h = Math.floor( (t - d * cd) / ch),
      m = Math.round( (t - d * cd - h * ch) / 60000),
      pad = function(n){ return n < 10 ? '0' + n : n; };
  if( m === 60 ){
    h++;
    m = 0;
  }
  if( h === 24 ){
    d++;
    h = 0;
  }
  return d;
}
module.exports.presenceToString = function(user, type) {
  var userStatus;
  var embedColor;
  if(user.presence.status == "dnd") {
    userStatus = "do not disturb<:dnd:455385674749575168>";
    embedColor = "#db2525"
  }
  if(user.presence.status == "offline") {
    userStatus = "offline/invisible<:offline:455385675076730900>";
    embedColor = "#8c8c8c"
  }
  if(user.presence.status == "idle") {
    userStatus = `idle<:idle:455385674665951234>`
    embedColor = "#e29b16"
  }
  if(user.presence.status == "online") {
    userStatus = `online<:online:455385674762158110>`
    embedColor = "0x00AE86"
  }
  if(type == "game") {
    return userStatus;
  }
  if(type == "color" || type == "colour") {
    return embedColor;
  }
}
module.exports.timeDifference = function(previous, current, explicit) {
  if(!current) current = new Date()
  if(!previous) return "(no date measured)"
  var msPerMinute = 60 * 1000;
  var msPerHour = msPerMinute * 60;
  var msPerDay = msPerHour * 24;
  var msPerMonth = msPerDay * 30;
  var msPerYear = msPerDay * 365;
  var elapsed = current - previous;
  var only = ""
  var suffix = ""
  if(explicit) suffix = " (!)"
  if(explicit) only = "only "

  if (elapsed < msPerMinute) {
    var s = ""
    if(Math.round(elapsed/1000) > 1) s = "s"
    return `${only}${Math.round(elapsed/1000)} second${s} ago${suffix}`
  }
  else if (elapsed < msPerHour) {
    var s = ""
    if(Math.round(elapsed/msPerMinute) > 1) s = "s"
    return `${only}${Math.round(elapsed/msPerMinute)} minute${s} ago${suffix}`
  }
  else if (elapsed < msPerDay ) {
    var s = ""
    if(Math.round(elapsed/msPerHour) > 1) s = "s"
    return `${only}${Math.round(elapsed/msPerHour )} hour${s} ago${suffix}`
  }
  else if (elapsed < msPerMonth) {
    var s = ""
    if(Math.round(elapsed/msPerDay) > 1) s = "s"
    return `approximately ${Math.round(elapsed/msPerDay)} day${s} ago`
  }
  else if (elapsed < msPerYear) {
    var s = ""
    if(Math.round(elapsed/msPerMonth) > 1) s = "s"
    return `approximately ${Math.round(elapsed/msPerMonth)} month${s} ago`
  }
  else {
    var s = ""
    if(Math.round(elapsed/msPerYear) > 1) s = "s"
    return `approximately ${Math.round(elapsed/msPerYear )} year${s} ago`
  }
}
module.exports.firstLetterUp = function(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}