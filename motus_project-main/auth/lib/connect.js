
//Connect database logic
module.exports = function () {
	const config = require('../config');
	const logger = require('log4js').getLogger('knex');
	return require('knex')({
		dialect: 'pg',
		connection: config.pg_db,
		searchPath: ['public'],
		pool: {min: 0, max: 3},
	}).on('query', q => logger.debug(q.sql, q.bindings));
}