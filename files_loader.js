var fs = require("fs"),
	cp = require("child_process")
	fetcherCommon = require('./fetcher.common');


exports.loadDir = function(dir){
	console.log("loading dir:" + dir);
	var files = fs.readdirSync(dir).filter(function(file){
		return file.indexOf(".xlsx") > -1;
	});
	var funds = files.map(function(file){
		var _s = file.split("_");

		return {
			url: "http://some_lie.com",
			body : _s[0],
			year : _s[1],
			quarter :  _s[2],
			number : _s[3].replace(".xlsx","")
		};
	});
	
	fetcherCommon.fetchFunds(funds,function(){
		console.log("all done!");
	});

}

