var URL = require("url"),
	http = require("http"),
	https = require("https"),
	fs = require("fs"),
	cp = require("child_process"),
	fc = require("./fetcher.common.js"),
	harel = require("./fetcher.harel.js"),
	CSVWriter = require("./CSVWriter.js"),
	db = require("./db.js"),
	Quarter = require("./quarter"),
	Promise = require("bluebird")
	validUrl = require("valid-url"),
	utils = require("./utils.js");

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

var readGoogleDocsFundsFile = function(){

	return new Promise(function(resolve, reject){

		var options = {
			host: "docs.google.com",
			port : 443,
			path : "/spreadsheets/d/1mUsNeb8gD2ELPKGpjD12AqZkuCybJlGCTz62oryLZY4/export?exportFormat=csv&gid=1311761971"
		}
		
		var data = '';

		https.get(options,function(res){
			res.on('data', function(chunk){
				data = data + chunk.toString();
			});
			res.on('end', function(){
				var parsedLines = data.split("\n");
				
				parseCsvFetch(parsedLines)
				.then(function(funds){
					resolve(funds);
				});

			});
		}).on('error',function(r){
			console.log("error fetching sheet",r);
			process.exit();
			reject("error fetching sheet "+r);
		});

	});
}

var parseCsvFetch = function(parsedLines){

	var reducer = function(out, line){
		var splt = line.split(',');
		var _out = [];
		var startYear = 2012;
		var startQuarter = 4;

		var quarter =  new Quarter(startYear, startQuarter -1);

		for (var i = 8; i < splt.length; i++){
			
			if (!validUrl.isUri(splt[i])) continue;

			if (splt[2] && splt[5] && splt[i])   
				_out.push({ body : splt[2], number : splt[5], url : splt[i], year : quarter.year, quarter : quarter.quarter + 1 })

			quarter.increase();
		}
		return out.concat(_out)
	}

	return new Promise(function(resolve, reject){
		resolve(parsedLines.reduce(reducer, []));
	});

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
	
	//console.log("step: "+step +" step + seed " + step + seed);

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

	var step = 4;
	for(var i = 0; i < Math.min(funds.length, step); ++i) {
		doFetch(step, funds, i);
	}
};

exports.fetchKnown = function(body, year, quarter, fund_number){

	readGoogleDocsFundsFile()
	.then(function(allFunds){
		

		//TODO: get chosen attributes from user
		var chosenFunds = allFunds.filter(function(f){
			return (body == undefined? true: f.body == body ||  ( isArray(body) && body.indexOf(f.body) > -1 ) ) 
			&& (fund_number == undefined ? true: f.number == fund_number ||  ( isArray(fund_number) && fund_number.indexOf(f.number) > -1 ))
			&& (year == undefined ? true: f.year == year ||  ( isArray(year) && year.indexOf(f.year) > -1 ))
			&& (quarter == undefined? true: f.quarter == quarter ||  ( isArray(quarter) && quarter.indexOf(f.quarter) > -1 ))
		})

		return chosenFunds;
	})
	.then(function(chosenFunds){
		fetchAllFunds(chosenFunds);	
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
			//fund.body == "Amitim" ||
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


function isArray(ar) {
  return Array.isArray(ar) ||
         (typeof ar === 'object' && objectToString(ar) === '[object Array]');
}



exports.dumpFunds = function(body, year, quarter, fund_number){

	readGoogleDocsFundsFile()
	.then(function(allFunds){
		

		body = 'Migdal';
		year = '2014';
		quarter = '2';
		fund_number = '659';

		//TODO: get chosen attributes from user
		var chosenFunds = allFunds.filter(function(f){
			return (body == undefined? true: f.body == body ||  ( isArray(body) && body.indexOf(f.body) > -1 ) ) 
			&& (fund_number == undefined ? true: f.number == fund_number ||  ( isArray(fund_number) && fund_number.indexOf(f.number) > -1 ))
			&& (year == undefined ? true: f.year == year ||  ( isArray(year) && year.indexOf(f.year) > -1 ))
			&& (quarter == undefined? true: f.quarter == quarter ||  ( isArray(quarter) && quarter.indexOf(f.quarter) > -1 ))
		})

		return chosenFunds;
	})
	.then(function(chosenFunds){

		return chosenFunds.map(function(chosenFund){

			var tableName = "pension_data_all"
			var sql = "SELECT * FROM "+ tableName +" WHERE managing_body='" +chosenFund.body +"'"
						+ " AND report_year='"+chosenFund.year+"' AND report_qurater='"+chosenFund.quarter+"'"
						+ " AND fund='"+chosenFund.number+"' ";
			return db.query(sql);

		});
	})
	.map(function(queryResult){
		console.log("=============================")
		// console.log(queryResult);
		var rowCount = queryResult.rowCount;
		var rows = queryResult.rows;
		var managing_body = rows[0].managing_body;
		var report_year = rows[0].report_year;
		var report_qurater = rows[0].managing_body;
		var fund = rows[0].fund;
		// var instrument_type = rows[0].
		// var instrument_sub_type = rows[0].

		var fundObj = utils.getFundObj(managing_body, report_year, report_qurater, fund);
		var filename = utils.filename("./from_db", fundObj, ".csv");

		console.log(rows);

		console.log("=============================")

		CSVWriter.write(managing_body, fund, report_year, report_qurater, instrument, instrumentSub, tabData, headers)
		return;

	});
	
};