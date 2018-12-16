var tools = require('./index.js')
var connection = require('./connection.js');

var qNoSince = `
SELECT
	game,
    SUM(TIMESTAMPDIFF(SECOND,startDate, IFNULL(endDate, NOW()))) AS time
FROM
    playtime
WHERE
    userID = ?
GROUP BY game
ORDER BY time DESC
LIMIT 10`
var qCustomSince = `
SELECT
	game,
    SUM(TIMESTAMPDIFF(SECOND,startDate, IFNULL(endDate, NOW()))) AS time
FROM
    playtime
WHERE
    userID = ?
    AND startDate > ?
GROUP BY game
ORDER BY time DESC
LIMIT 10`

module.exports = function(id, customSince, callback) {
  if(customSince) {
    customSince = tools.convert.sinceDate(customSince)
    connection.query(qCustomSince, [id, customSince], function(error, results, fields) {
      callback(results);
    })
  } else {
    connection.query(qNoSince, [id], function(error, results, fields) {
      callback(results);
    })
  }
}