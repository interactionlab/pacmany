const pg = require('pg')
var GAME_CONFIG = require('./config.json');

const pool = new pg.Pool(GAME_CONFIG.DBConfig);

pool.on('error', function (err, client) {
	console.error('idle client error', err.message, err.stack)
})

module.exports.query = function (text, values, callback) {
	console.log('query', text, values);
	return pool.query(text, values, callback);
};

module.exports.connect = function (callback) {
	return pool.connect(callback);
};