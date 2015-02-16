var Promise = require('bluebird');
var fsep = require('fs-extra-promise');
var pg = require('postgres-bluebird');
var copyFrom = require('pg-copy-streams').from;
var config = require('./config');
var throat = require('throat')
var path = require('path');


module.exports.importDirCmd = function(parentDir, tableName, concurrency){	
	return fsep.readdirAsync(parentDir)
	.then(function(files) {

	    return importFiles(files, parentDir, tableName, concurrency); 
	})
	.then(function(res){
		// console.log("done:"+res['done']);
		// console.log("errors:"+res['errors']);
		fsep.writeFile("errors.log", res['errors']);
	})
	.catch(function(err){
		console.log("error:" +err);
	})
}


module.exports.importFileCmd = function(filePath, tableName){

	var filename =  filePath.replace(/^.*(\\|\/|\:)/, '');
	var parentDir = filePath.substr(0, filePath.length - filename.length);

	process.stdout.cursorTo (0);
	process.stdout.write("Importing: "+filename);

    return importFile(parentDir, filename, tableName)
	.then(function(res){
		if (!res){
			console.log("Not imported")
		}
		else{
			console.log("Done.")
		}
	})
	.catch(function(err){
		console.log("error:" +err);
	})
}



var importFiles = function(files, parentDir, tableName, concurrency){

	if ( concurrency == undefined) concurrency = 4;
	var total = files.length;
	var counter = 0;

	return Promise.all(files.map(throat(concurrency, function(filename){

		process.stdout.cursorTo (0);
		process.stdout.write(++counter+'/'+total + ":"+ filename);
	
		if ( filename.substr(-4) !== '.csv' ){
			return;
		}

		return importFile(parentDir, filename, tableName);

	})))
	.then(function(resArr){

		var result = {}
		result['errors'] = [];
		result['done'] = [];
		
		for (i in resArr){
			if(resArr[i] === true){
				result['done'].push(files[i]);
			}
			else if (resArr[i] === false){
				result['errors'].push(files[i]);
			}
		}

		return result;
	})
} 


function importFile(parentDir, filename, tableName){
	return  pg.connectAsync(config.connection_string)
				.spread(function(client, release) {

		            var filePath = path.join(parentDir, filename);

					//Check if file already loaded to DB
					var fund = filename.split('_')[1];
					var year = filename.split('_')[2];
					var quarter = filename.split('_')[3].split('.')[0];
					var managing_body = filename.split('_')[0];

					return client.queryAsync("SELECT count(*) FROM "+ tableName +" WHERE managing_body='" +managing_body +"'"
					+ " AND report_year='"+year+"' AND report_qurater='"+quarter+"'"
					+ " AND fund='"+fund+"' ")
						.then(function(qresult){
							release();
							return new Promise(function(resolve,reject){

								var count = qresult.rows[0].count;

								if (count > 0){ //file in DB, skip file
									console.log(" file already loaded to DB	");
									resolve();
									return; 
								}

								//File not in DB, copy to table
								var pgstream = client.query(copyFrom('COPY '+ tableName +' FROM STDIN HEADER CSV NULL \'\'' ));
								var sqlStream = fsep.createReadStream(filePath);
							
							  	sqlStream.on('error', 
								  	function(err){
								  		console.log(" " +err)
										resolve(false);				  		
							  	});
							  	sqlStream.pipe(pgstream)
									.on('end', 
									  	function(){
											resolve(true);
								  		})
								  	.on('error', 
								  		function(err){
									  		console.log(" " +err)
											resolve(false);
									  	});


							});

					})
			})
}