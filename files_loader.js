var fs = require("fs"),
	cp = require("child_process"),
	path = require('path'),
	utils = require('./utils.js'),
	Promise = require('bluebird'),
	fetcherCommon = require('./fetcher.common'),
	genericImporter = require("./genericImporter.js"),
	CSVWriter = require("./CSVWriter.js")


exports.loadDir = function(dir){

	if (dir.indexOf(path.sep) != dir.length){
		dir += path.sep;
	}

	console.log("loading dir:" + dir);
	var files = fs.readdirSync(dir).filter(function(file){
		return file.indexOf(".xlsx") > -1 || file.indexOf(".xls") > -1;
	});

	fetcherCommon.changeBaseFolder(dir);

	return new Promise.each(files, function(file){

		console.log("Converting: "+  file);
	
		var xlFilename = path.join(dir,file);
		var fund = utils.getFundFromFile(file);
		var csvFilename = utils.filename('./tmp',fund, '.csv');

		if (fs.existsSync(csvFilename)){
			console.log("converted file exists:" + csvFilename );
			return;
		}

		return genericImporter.parseXls(xlFilename)
			.then(function(result){
				return CSVWriter.writeParsedResult(fund.body, fund.number, fund.year, fund.quarter, result);
			});
	})
	.then(function(){
		console.log("all done");
	})
	

}

