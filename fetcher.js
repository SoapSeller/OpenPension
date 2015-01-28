var URL = require("url"),
	http = require("http"),
	https = require("https"),
	fs = require("fs"),
	cp = require("child_process"),
	fc = require("./fetcher.common.js"),
	harel = require("./fetcher.harel.js"),
	db = require("./db.js"),
	Quarter = require("./quarter");

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
		var startYear = 2012;
		var startQuarter = 4;

		var quarter =  new Quarter(startYear, startQuarter -1);

		for (var i = 8; i < splt.length; i++){
			if (splt[2] && splt[5] && splt[i])   
				_out.push({ body : splt[2], number : splt[5], url : splt[i], year : quarter.year, quarter : quarter.quarter + 1 })

			quarter.increase();
		}
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

var getContribFunds = function(cb) {
    var client = (new db.pg(true)).client;

    client.query("SELECT q.id, q.year, q.quarter, q.url, q.status, f.managing_body, f.id as fund_id, f.name as fund_name, f.url as fund_url FROM admin_funds_quarters as q, admin_funds as f WHERE q.fund_id = f.id AND status = 'validated'", function(err, result) {

        if(err) {
            return console.error('error running query', err);
        }

        var funds = [];

        result.rows.forEach(function(f) {
            funds.push({
                body: f.managing_body,
                number: f.fund_id,
                url: f.url,
                year: f.year,
                quarter: f.quarter+1
            });
        });


        cb(funds);
    });
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
	});
};

exports.fetchContrib = function(){
    getContribFunds(fetchAllFunds);
};


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
			fund.body == "psagot" ||
			fund.body == "fenix" ||
			fund.body == "xnes"
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
