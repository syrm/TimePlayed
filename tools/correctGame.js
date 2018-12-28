var connection = require('./connection.js');

module.exports.user = function(game, id, callback) {
    var q = `
    SELECT
        game
    FROM gameAliases
    WHERE
        alias=? 
        AND game IN (SELECT DISTINCT GAME FROM playtime WHERE userID=?) 
    UNION
    SELECT
        DISTINCT game
    FROM playtime
    WHERE
        userID=?
    HAVING
        levenshtein(game, ?) < 4
        AND game NOT IN (SELECT alias FROM gameAliases WHERE alias=?)`
    connection.query(q, [game, id, id, game, game], function(error, results, fields) {
        if(results[0]) {
            callback(results[0].game)
        } else {
            callback()
        }
    })
}

module.exports.server = function(game, id, callback) {
    var q = `
    SELECT
        game
    FROM gameAliases
    WHERE
        alias=?
    UNION
    SELECT
        DISTINCT game
    FROM guildStats
    WHERE guildID=?
    HAVING
        levenshtein(game, ?) < 4
        AND game NOT IN (SELECT alias FROM gameAliases WHERE alias=?)`
    connection.query(q, [game, id, game, game], function(error, results, fields) {
        if(results[0]) {
            callback(results[0].game)
        } else {
            callback()
        }
    })
}