var tools = require('./index.js')
var connection = require('./connection.js');

module.exports = function(id, since, callback) {
  customSince = tools.convert.sinceDate(since, true)
  tools.getStartDate(id, function(startDate) {
    connection.query(`SELECT * FROM playtime WHERE userID=${id}`, function(error, results, fields) {
      var games = [];
      var totalMS = 0;
      results.forEach(function(result, i) {
        if(!result.endDate) {
          if(i != results.length - 1) {
            return;
          } else {
            result.endDate = new Date()
          }
        }
        var diffMS = 0;
        if(result.endDate > customSince) {
          if(result.startDate < customSince) {
            diffMS = Math.abs(result.endDate.getTime() - customSince.getTime())
          }
          if(result.startDate > customSince) {
            diffMS = Math.abs(result.endDate.getTime() - result.startDate.getTime());
          }
        }
        if(diffMS < 1) return;
        totalMS += diffMS;
        if(games.some(e => e.game == result.game)) {
            var index = games.map(e => {return e.game}).indexOf(result.game);
            games[index].time += diffMS;
        } else {
            games.push({game: result.game, time: diffMS})
        }
      })
      games.sort(function(a, b){return b.time-a.time});
      return callback(games, totalMS)
    })
  })
}