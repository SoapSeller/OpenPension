var fs = require("fs"),
	cp = require("child_process"),
	path = require('path'),
	utils = require('./utils.js'),
	Promise = require('bluebird'),
	fetcherCommon = require('./fetcher.common'),
	genericImporter = require("./genericImporter.js"),
	fse = require("fs-extra"),
	logger = require("./logger.js"),
	CSVWriter = require("./CSVWriter.js")


exports.convertDir = function(dir){

	if (dir.indexOf(path.sep) != dir.length){
		dir += path.sep;
	}

	console.log("loading dir:" + dir);
	var files = fs.readdirSync(dir).filter(function(file){
		return file.indexOf(".xlsx") > -1 || file.indexOf(".xls") > -1;
	});

	fetcherCommon.changeBaseFolder(dir);

	return new Promise.each(files, function(file){

		logger.info("Converting: "+  file);
	
		var xlFilename = path.join(dir,file);
		var fund = utils.getFundFromFile(file);
		var csvFilename = utils.filename('./tmp',fund, '.csv');

		if (fs.existsSync(csvFilename)){
			logger.warn("converted file exists:" + csvFilename );
			return;
		}

		return genericImporter.parseXls(xlFilename)
			.then(function(result){
				return CSVWriter.writeParsedResult(fund.body, fund.number, fund.year, fund.quarter, result);
			})
			.catch(function(e){
				logger.warn("error converting file: " + file);
				//console.log(e.stack);
				if (fs.existsSync(csvFilename)){
					fs.unlinkSync(csvFilename);
				}

				fixFileFormat(xlFilename)
				.then(genericImporter.parseXls)
				.then(function(result){
					logger.info("fixed by converting:"+xlFilename);
					return CSVWriter.writeParsedResult(fund.body, fund.number, fund.year, fund.quarter, result);
				})
				.catch(function(e){
					logger.error("final: error converting file: " + file);
				});
			});
	})
	.then(function(){
		logger.info("all done");
	})
	

}

function fixFileFormat(xlFilename){

	return new Promise(function(resolve, reject){

		logger.info("Checking format: " + xlFilename);	

		cp.exec("file " + xlFilename, function (err, stdout, stderr) {

			logger.info("Got file info :"+ stdout);
			if (!err &&
				(
					stdout.toString().indexOf("CDF V2") !== -1 ||
					stdout.toString().indexOf("Composite Document File V2 Document") !== -1 ||
					stdout.toString().indexOf("Microsoft Excel 2007+") !== -1
				)) {
				var cmd = "ssconvert --export-type=Gnumeric_Excel:xlsx " + xlFilename;

				logger.info("converting to XLSX: " + xlFilename );
				cp.exec(cmd, function(err, stdout, stderr) {
					if (err){
						logger.warn("error converting file:" + xlFilename + " err:" + err);
						reject(xlFilename);
					}

//					fs.renameSync(xlFilename, newPath)

					fs.unlink(xlFilename, function() {

						var fund = utils.getFundFromFile(xlFilename);
						var xlsxFilename = utils.filename("",fund,".xlsx");

						logger.info("converted "+xlFilename+" to XLSX: " + xlsxFilename);

						resolve(xlsxFilename);
	       			});
				});
			} else if (stdout.toString().indexOf("Zip archive data, at least v2.0 to extract") !== -1) {
				// File is already xlsx, just move it to the right name
				var fund = utils.getFundFromFile(xlFilename);
				logger.warn("file is actually xlsx: "+xlFilename);

				fse.copySync(xlFilename, path.join('./prob/',xlFilename));
		//		cp.exec("mv -f " + utils.filename('./tmp/', fund, '.xls') + " " + utils.filename('./tmp/', fund, '.xlsx'), function(err, stdout, stderr) {
		//			resolve(utils.filename('./tmp/', fund, '.xlsx'));
		//		});
			} else {
				logger.error("Unknown file format for: "+ xlFilename + " : " + stdout.toString());
//				fs.unlink(xlFilename, function() {
						reject(xlFilename);
  //              });
			}
		});

	});
		
}