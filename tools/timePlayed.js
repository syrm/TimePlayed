var tools = require('./index.js')
var connection = require('./connection.js');

var qDefaultSinces = `
SELECT
    SUM(IF(
        startDate > NOW() - INTERVAL 1 DAY,
        TIMESTAMPDIFF(SECOND,startDate, IFNULL(endDate, NOW())),
        0)) AS today,
    SUM(IF(
		    startDate > NOW() - INTERVAL 1 WEEK,
        TIMESTAMPDIFF(SECOND,startDate, IFNULL(endDate, NOW())),
        0)) AS week,
	  SUM(
		    TIMESTAMPDIFF(SECOND,startDate, IFNULL(endDate, NOW()))
        ) AS total
FROM
    playtime
WHERE
    userID = ?
    AND game = ?`

var qCustomSince = `
SELECT 
    SUM(IF(
		startDate > ?,
        TIMESTAMPDIFF(SECOND,startDate, IFNULL(endDate, NOW())),
        0)) AS time
FROM
    playtime
WHERE
    userID = ?
    AND game = ?`

module.exports =  function(id, game, customSince, callback) {
  if(customSince) {
    customSince = tools.convert.sinceDate(customSince)
    connection.query(qCustomSince, [customSince, id, game], function(error, results, fields) {
      callback(results[0]);
    })
  } else {
    connection.query(qDefaultSinces, [id, game], function(error, results, fields) {
      callback(results[0])
    })
  }
}