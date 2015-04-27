var fs = require("fs"),
	cp = require("child_process"),
	path = require('path'),
	utils = require('./utils.js'),
	Promise = require('bluebird'),
	fetcherCommon = require('./fetcher.common');


exports.loadDir = function(dir){

	if (dir.indexOf(path.sep) != dir.length){
		dir += path.sep;
	}

	console.log("loading dir:" + dir);
	var files = fs.readdirSync(dir).filter(function(file){
		return file.indexOf(".xlsx") > -1 || file.indexOf(".xls") > -1;
	});

	fetcherCommon.changeBaseFolder(dir);

	return new Promise(function(resolve,reject){
		resolve(files.map(function(file){
			var _s = file.split("_");

			return {
				url: "http://some_lie.com/"+file,
				body : _s[0],
				year : _s[1],
				quarter :  _s[2],
				number : _s[3].split('.')[0]
			};
		}));
	})
	.each(function(fund){
		var ext = path.extname(fund.url).toLowerCase();
		var fund = utils.getFundObj(fund.body, fund.year, fund.quarter, fund.number);
		return fetcherCommon.importFund(fund, ext);
	})
	.then(function(){
		console.log("all done");
	})
	

}

