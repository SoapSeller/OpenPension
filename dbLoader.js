var fsep = require('fs-extra-promise');
var pg = require('postgres-bluebird');
var copyFrom = require('pg-copy-streams').from;
var config = require('./config');
var throat = require('throat')
var path = require('path');
var fs = require('fs');
var logger = require('./logger')(module);
var Utils = require('./utils');
var Promise = require('bluebird');
var countFundRowsTemplate = handlebars.compile(fs.readFileSync(__dirname + '/sql/countFundRows.hbs').toString());

module.exports.importFilesCmd = function(parentDir, body, year, quarter, fund_number, tableName, concurrency){	
	return fsep.readdirAsync(parentDir)
	.then(function(files) {

		files = Utils.filterFiles(files, body, year, quarter, fund_number);
		return module.exports.importFiles(parentDir, files, tableName, concurrency); 
	})
	.then(function(res){
		fsep.writeFile("errors.log", res['errors']);
	})
	.catch(function(err){
		logger.error("error:" + err)
	})
}


module.exports.importFileCmd = function(filePath, tableName){

	var filename =  filePath.replace(/^.*(\\|\/|\:)/, '');
	var parentDir = filePath.substr(0, filePath.length - filename.length);

	//process.stdout.cursorTo (0);
	process.stdout.write("Importing: "+filename + "\n");

    return module.exports.importFile(parentDir, filename, tableName)
	.then(function(res){
		if (!res){
			logger.warn("Not imported",res);
		}
		else{
			logger.info("Done importing.");
		}
	})
	.catch(function(err){
		logger.error("error:" +err);
	})
}



/**
 * Import files to db, concurrently --> resolves to
 *
 * 
 * result['done'] = [filenames...]
 * result['errors'] = [filenames...]
 */
module.exports.importFiles = function(parentDir, files, tableName, concurrency){

	if ( concurrency == undefined) concurrency = 4;
	var total = files.length;
	var counter = 0;

	return Promise.all(files.map(throat(concurrency, function(filename){

		//process.stdout.cursorTo (0);
		process.stdout.write(++counter+'/'+total + ":"+ filename + "\n");
	
		if ( filename.substr(-4) !== '.csv' ){
			return;
		}

		return module.exports.importFile(parentDir, filename, tableName);

	})))
	.then(function(resArr){

		//resArr - array of booleans, 
		//represents success/fail of corresponding file index

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
	});
} 

//import file to db --> resolves to boolean
module.exports.importFile = function(parentDir, filename, tableName){
	return  pg.connectAsync(config.connection_string)
				.spread(function(client, release) {

		            var filePath = path.join(parentDir, filename);
		            
		            if (!fs.existsSync(filePath)){
			            var absolutePath = path.resolve(filePath);
			            console.log("File not found " + absolutePath);
		            }
		            
					//Check if file already loaded to DB
					var year = filename.split('_')[1];
					var quarter = filename.split('_')[2];
					var fund = filename.split('_')[3].split('.')[0];
					var managing_body = filename.split('_')[0];

					var data = {
						tableName : tableName,
						report_year : year,
						report_quarter : quarter,
						fund : fund,
						managing_body : managing_body
					};

					var countFundSql = countFundRowsTemplate(data);

					return client.queryAsync(countFundSql)
						.then(function(qresult){
							release();
							return new Promise(function(resolve,reject){

								var count = qresult.rows[0].count;

								if (count > 0){ //file in DB, skip file
									logger.info([managing_body, year, quarter, fund].join("_") + " file already loaded to DB	")
									resolve();
									return; 
								}

								//File not in DB, copy to table
								var pgstream = client.query(copyFrom('COPY '+ tableName +' FROM STDIN HEADER CSV NULL \'\'' ));
								var sqlStream = fsep.createReadStream(filePath);
							
							  	sqlStream.on('error', 
								  	function(err){
								  		logger.error(" " +err)
										resolve(false);				  		
							  	});
							  	sqlStream.pipe(pgstream)
									.on('end', 
									  	function(){
											resolve(true);
								  		})
								  	.on('error', 
								  		function(err){
									  		logger.error(" " +err)
											resolve(false);
									  	});


							});

					})
			})
}