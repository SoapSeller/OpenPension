pg = require('pg')

config = require("./_config")

tableName = config.table

pg.connect config.connection_string, (err, client, done)->
	q = "select count(*) from #{tableName}"
	client.query q, (a,b)->
		console.log a,b