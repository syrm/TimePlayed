var tools = require('./index.js')
var connection = require('./connection.js');

var qDefaultSinces = `
SELECT
    SUM(IF(
        startDate > ?,
        TIMESTAMPDIFF(SECOND,startDate, IFNULL(endDate, NOW())),
        0)) AS today,
    SUM(IF(
		    startDate > ?,
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
    var today = new Date();
    today.setHours(6);
    today.setMinutes(0);
    today.setSeconds(0);
    var weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    connection.query(qDefaultSinces, [today, weekAgo, id, game], function(error, results, fields) {
      callback(results[0])
    })
  }
}