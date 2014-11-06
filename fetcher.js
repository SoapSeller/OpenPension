var URL = require("url"),
	http = require("http"),
	https = require("https"),
	fs = require("fs"),
	cp = require("child_process"),
	fc = require("./fetcher.common.js"),
	harel = require("./fetcher.harel.js");

var cUrl = 6,
	cNum = 4,
	cBody = 3;

var bodys = {
	"אחר": "other",
	"מגדל": "migdal",
	"מנורה": "menora",
	"פניקס": "fenix",
	"כלל": "clal",
	"דש איפקס": "dash",
	"הראל": "harel",
	"אנליסט": "analyst",
	"אלטשולר": "altshuler",
	"איילון": "ayalon",
	"אי.בי.אי": "IBI",
	"אקסלנס": "xnes",
	"אינפיניטי": "infinity",
	"הלמן": "helman",
	"ארגון המורים העל יסודיים": "highschools_teachers",
	"הסתדרות המורים בישראל": "teachers",
	"דיסקונט": "discount",
	"אקדמאים במדעי החברה": "havera_acdemics",
	"ביוכימאים": "biochemists" ,
	"הסוכנות היהודית": "hasochnut",
	"עמיתים" : "amitim"
};

var parseBody = function(body) {
	for (var k in bodys) {
		if (body.indexOf(k) != -1) {
			return bodys[k];
		}
	}

	return null;
};

var readFundsFileFetching = function(cb){

	var options = {
		host: "docs.google.com",
		post : 443,
		path : "/spreadsheets/d/1mUsNeb8gD2ELPKGpjD12AqZkuCybJlGCTz62oryLZY4/export?exportFormat=csv&gid=1311761971"
	}
	
	var data = '';

	https.get(options,function(res){
		res.on('data', function(chunk){
			data = data + chunk.toString();
		});
		res.on('end', function(){
			var parsedLines = data.split("\n")
			parseCsvFetch(parsedLines, cb);
		});
	}).on('errpr',function(r){
		console.log("error fetching sheet",r);
		process.exit();
	});

}

var parseCsvFetch = function(parsedLines,cb){
	
	var reducer = function(out, line){
		var splt = line.split(',');
		var _out = [];
		if (splt[2] && splt[5] && splt[8])   _out.push({ body : splt[2], number : splt[5], url : splt[8], year : 2012, quarter : 4 })
		if (splt[2] && splt[5] && splt[9])   _out.push({ body : splt[2], number : splt[5], url : splt[9], year : 2013, quarter : 1 })
		if (splt[2] && splt[5] && splt[10])  _out.push({ body : splt[2], number : splt[5], url : splt[10], year : 2013, quarter : 2 })
		if (splt[2] && splt[5] && splt[11])  _out.push({ body : splt[2], number : splt[5], url : splt[11], year : 2013, quarter : 3 })
		if (splt[2] && splt[5] && splt[12])  _out.push({ body : splt[2], number : splt[5], url : splt[12], year : 2013, quarter : 4 })
		if (splt[2] && splt[5] && splt[13])  _out.push({ body : splt[2], number : splt[5], url : splt[13], year : 2014, quarter : 1 })
		return out.concat(_out)
	}
	cb(parsedLines.reduce(reducer, []));
}


/* Read & parse files_data.csv file */
var readFundsFile = function() {

	var parsedLines = require('fs').readFileSync('files_data.csv').toString().split("\n");

	var funds = [];

	var columnsCount = parsedLines[0].split(',').length;

	for (var i = 2; i < parsedLines.length; ++i) {
		var splt = parsedLines[i].split(',');

		if (splt.length != columnsCount) {
			continue;
		}

		var url = splt[cUrl].trim();
		if (url !== '') {
			var body = splt[cBody];

			var englishBody = parseBody(body);

			if (englishBody === null) {
				console.log("Unknwon body: ", body);
			} else {
				funds.push({
					body: englishBody,
					number: splt[cNum],
					url: url
				});
			}
		}
	}

	return funds;
};


var doFetch = function(step, funds, seed) {
	if (seed < funds.length) {
		var fund = funds[seed];
		var next = doFetch.bind(this, step, funds, seed+step);
		switch (fund.body) {
			case "harel":
				harel.fetchOne(fund, next);
			break;
			default:
				fc.fetchFund(fund, next);
		}
	}
};

/* Fetch all funds */
exports.fetchAll = function(funds) {

	var step = 8;
	for(var i = 0; i < Math.min(funds.length, step); ++i) {
		doFetch(step, funds, i);
	}
};

exports.fetchKnown = function(){
	readFundsFileFetching(function(allFunds){
		fetchAllFunds(allFunds);
	})
}


var fetchAllFunds = function(allFunds){

	var funds = [];

	for(var i = 0; i < allFunds.length; ++i) {
		var fund = allFunds[i];
		if (
			// fund.body == "Amitim" ||
			fund.body == "clal" ||
			fund.body == "DS" ||
			fund.body == "Harel" ||
			fund.body == "Menora" ||
			fund.body == "Migdal" ||
			fund.body == "psagot"
			) {
			funds.push(fund);
		}
	}
	//console.log(funds);
	
	exports.fetchAll(funds);
};

exports.fetchMenora = function(){
	var allFunds = readFundsFileFetching();
	var funds = [];

	for(var i = 0; i < allFunds.length; ++i) {
		var fund = allFunds[i];
		if (fund.body == "Menora") {
			funds.push(fund);
		}
	}

	exports.fetchAll(funds);
};


exports.fetchAmitim = function(){
	var allFunds = readFundsFileFetching();
	var funds = [];

	for(var i = 0; i < allFunds.length; ++i) {
		var fund = allFunds[i];
		if (fund.body == "amitim") {
			funds.push(fund);
		}
	}

	exports.fetchAll(funds);
};

exports.fetchHarel = function() {
	var allFunds = readFundsFile();

	var funds = [];

	for(var i = 0; i < allFunds.length; ++i) {
		var fund = allFunds[i];
		console.log(fund.body);
		if (fund.body == "harel") {
			funds.push(fund);
		}
	}

	exports.fetchAll(funds);
	// var outFile = fs.createWriteStream("test.csv");

	// var count = funds.length;
	// var handleDone = function(fund, fundFiles) {
	// 	console.log("Writing fund", fund.number, "files");
	// 	for (var i = 0; i < fundFiles.length; ++i) {
	// 		var file = fundFiles[i];
	// 		outFile.write([fund.number, file.year, file. q, file.url].join(',') + "\n");
	// 	}

	// 	if (--count === 0) {
	// 		console.log("All funds fetched.");
	// 		outFile.end();
	// 	}
	// };

	// for (i = 0; i < funds.length; ++i) {
	// 	harel.fetchOne(funds[i], handleDone);
	// }
};
