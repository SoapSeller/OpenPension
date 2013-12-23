var URL = require("url"),
	http = require("http"),
	https = require("https"),
	fs = require("fs"),
	cp = require("child_process"),
	fc = require("./fetcher.common.js"),
	harel = require("./fetcher.harel.js");

var cUrl = 3,
	cNum = 2,
	cBody = 0;

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
	"הסוכנות היהודית": "hasochnut"
};

var parseBody = function(body) {
	for (var k in bodys) {
		if (body.indexOf(k) != -1) {
			return bodys[k];
		}
	}

	return null;
};

/* Read & parse funds.csv file */
var readFundsFile = function() {

	var parsedLines = require('fs').readFileSync('funds.csv').toString().split("\n");

	var funds = [];

	var columnsCount = parsedLines[0].split(',').length;

	for (var i = 1; i < parsedLines.length; ++i) {
		var splt = parsedLines[i].split(',');

		if (splt.length != columnsCount) {
			continue;
		}

		var url = splt[cUrl].trim();
		if (url !== '') {
			var body = splt[cBody];

			var englishBody = parseBody(body);

			if (englishBody === null) {
				console.log(body);
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
	if (funds === undefined) {
		funds = readFundsFile();
	}

	var step = 5;
	for(var i = 0; i < Math.min(funds.length, step); ++i) {
		doFetch(step, funds, i);
	}
};

exports.fetchHarel = function() {
	var allFunds = readFundsFile();

	var funds = [];

	for(var i = 0; i < allFunds.length; ++i) {
		var fund = allFunds[i];
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
