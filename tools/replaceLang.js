module.exports = function(toReplace, replaceValue, msg) {
    var lang = msg;
    for(var key1 in lang) {
      for(var key2 in lang[key1]) {
        if(typeof lang[key1][key2] == "object") {
          for(var key3 in lang[key1][key2]) {
            if(typeof lang[key1][key2][key3] == "string") {
              lang[key1][key2][key3] = lang[key1][key2][key3].replace(toReplace, replaceValue)
            } 
          }
        } else if(typeof lang[key1][key2] == "string") {
          lang[key1][key2] = lang[key1][key2].replace(toReplace, replaceValue)
        }
      }
    }
    return lang;
  }