// Load module
var mysql = require('mysql');
const keys = require('../keys.json')
// Initialize pool
var pool      =    mysql.createPool({
    connectionLimit : 3,
    host: 'localhost',
    user: keys.mysqlusername,
    password: keys.mysqlpasswd,
    database: 'timeplayed',
    supportBigNumbers: true,
    charset: 'utf8mb4',
    bigNumberStrings: true
});
module.exports = pool;