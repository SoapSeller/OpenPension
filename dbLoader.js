var fsep = require('fs-extra-promise');
var pg = require('pg');
var copyFrom = require('pg-copy-streams').from;
var config = require('./config');
var Promise = require('bluebird');
var throat = require('throat')

var path = require('path');

module.exports.importDir = function(parentDir, tableName){	
	return fsep.readdirAsync(parentDir)
	.then(function(files) {

	    return importFiles(files, parentDir, tableName);    
	})
	.then(function(res){
		// console.log("done:"+res[0]['done']);
		// console.log("errors:"+res[0]['errors']);
		fsep.writeFile("errors.log", res[0]['errors']);
	})
	.catch(function(err){
		console.log("error:" +err);
	})
}




var importFiles = function(files, parentDir, tableName){

	var total = files.length;
	var counter = 0;

	var result = {}
	result['errors'] = [];
	result['done'] = [];

	return Promise.all(files.map(throat(4, function(filename){


		process.stdout.cursorTo (0);
		process.stdout.write(++counter+'/'+total + ":"+ filename);

	 	return new Promise(function(resolve, reject ){
	
			pg.connect(config.connection_string, function(err, client, release) {

		            var filePath = path.join(parentDir, filename);

					if ( filename.substr(-4) !== '.csv' ){
						release();
						resolve(result);
						return;
					}


					//Check if file already loaded to DB
					var fund = filename.split('_')[1];
					var year = filename.split('_')[2];
					var quarter = filename.split('_')[3].split('.')[0];
					var managing_body = filename.split('_')[0];

					client.query("SELECT count(*) FROM "+ tableName +" WHERE managing_body='" +managing_body +"'"
					+ " AND report_year='"+year+"' AND report_qurater='"+quarter+"'"
					+ " AND fund='"+fund+"' ", function(err, qresult){
						release();

						var count = qresult.rows[0].count;

						if (count > 0){ //file in DB, skip file
							console.log("file already loaded to DB:" + filename)
							release();
							resolve(result);
							return;
						}


						//File not in DB, copy to table
						var pgstream = client.query(copyFrom('COPY '+ tableName +' FROM STDIN HEADER CSV NULL \'\'' ));
						var sqlStream = fsep.createReadStream(filePath);
					
					  	sqlStream.on('error', 
						  	function(err){
						  		if (result['done'].indexOf(filename) > -1 )
								  		console.log("fuck you111")

						  		result['errors'].push(filename);
						  		console.log(err + ", " +filename )
								release();
								resolve(result);						  		
					  	});
					  	sqlStream.pipe(pgstream)
							.on('end', 
							  	function(){
							  		if (result['errors'].indexOf(filename) > -1 )
								  		console.log("fuck you2222")

								  	result['done'].push(filename);
							  		release();
									resolve(result);
						  		})
						  	.on('error', 
						  		function(err){
							  		if (result['done'].indexOf(filename) > -1 )
								  		console.log("fuck you333")

							  		result['errors'].push(filename);
							  		console.log(err + ", " +filename )
									release();
									resolve(result);									
							  	});
					});

		        });

		});
	})));

} 
