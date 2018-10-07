var tools = require("./index.js");

// Convert seconds to hours, minutes and seconds
module.exports.timeToString =  function(num) {
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
// Convert seconds to days, hours, minutes OR seconds (for role awards)
module.exports.secondsToTime = function(num, simple) {
  num = Number(num);
  var w = Math.floor(num / 60 / 60 / 24 / 7)
  var d = Math.floor(num / 86400);
  num -= d * 86400;
  var h = Math.floor(num / 3600) % 24;
  num -= h * 3600;
  var m = Math.floor(num / 60) % 60;
  num -= m * 60;
  var s = num % 60;
  var itl = ""
  if(!simple) itl = "In the last ";

  if(w > 0) {
    return `${itl}${w} week${w > 1 ? "s" : ""}`
  }
  if(d > 0) {
    return `${itl}${d} day${d > 1 ? "s" : ""}`
  }
  if(h > 0) {
    return `${itl}${h} hour${h > 1 ? "s" : ""}`
  }
  if(m > 0) {
    return `${itl}${m} minute${m > 1 ? "s" : ""}`
  }
  if(s > 0) {
    return `${itl}${s} second${s > 1 ? "s" : ""}`
  }
}


// Convert string (e.a. 5m) to a date minus the specified amount
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
// Convert time string (e.a. 5m) to seconds
module.exports.stringToSeconds = function(str) {
  var now = new Date();
  var diffMS = Math.abs(now.getTime() - tools.convert.sinceDate(str))
  return Math.floor(diffMS / 1000);
}

// Convert 1 to 1st, 2 to 2nd, etc.
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

// Calculate difference between two dates
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