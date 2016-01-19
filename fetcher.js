var http = require("http"),
	https = require("https"),
	fs = require("fs"),
	fc = require("./fetcher.common.js"),
	CSVWriter = require("./CSVWriter.js"),
	db = require("./db.js"),
	Quarter = require("./quarter"),
	Promise = require("bluebird"),
	_ = require("underscore"),
	Utils = require("./utils.js");


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
				var Baby = require('babyparse');

				data = String(data).replace(/ /g,''); //remove whitespaces
				data = Baby.parse(data, {header:false}).data;

				parseCsvFetch(data)
				.then(function(funds){
					resolve(funds);
				});
			});
		})
		.on('error',function(r){
			console.log("error fetching sheet",r);
			process.exit();
			reject("error fetching sheet "+r);
		});

	});
}

var validateUrl = function(url){
	var RegExp = /(http|https):\/\//;

	if(RegExp.test(url)){
		if (url.indexOf('http') == 0 ){
			return url;
		}
		else{ //try to find start of url
			url = url.slice(url.indexOf('http'));
			return url;
		}
	}else{
		return null;
	}
}



var parseCsvFetch = function(parsedLines){

	var reducer = function(out, line){

		var _out = [];

		//beginning cell
		var startYear = 2012;
		var startQuarter = 4;

		var quarter =  new Quarter(startYear, startQuarter -1);

		for (var i = 8; i < line.length; i++){

			var url = validateUrl(line[i]);
			var body = line[2];
			var number = line[5];

			if (body && number && url )
				_out.push({ body : body, number : number, url : url, year : quarter.year, quarter : quarter.quarter + 1 })

			quarter.increase();
		}
		return out.concat(_out)
	}

	return new Promise(function(resolve, reject){
		resolve(parsedLines.reduce(reducer, []));
	});

}



var getContribFunds = function() {

	return new Promise(function(resolve, reject){

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


	        resolve(funds);
    	});
	});
};


exports.fetchKnown = function(body, year, quarter, fund_number, trgdir, overwrite){

	if (!fs.existsSync(trgdir)){
		logger.info("Creating directory:" +trgdir);
		fs.mkdirSync(trgdir);
	}

	readGoogleDocsFundsFile()
	.then(function(allFunds){
		return Utils.filterFunds(allFunds, body, year, quarter, fund_number);
	})
	.each(function(fund){
		fc.downloadFundFile(fund, trgdir, overwrite);
	})
	.then(function(xlFilename){
		//console.log(xlFilename);
	})
	.catch(function(e){
		console.log(e.stack);
	});
};



exports.fetchContrib = function(){
    getContribFunds()
    // .then(function(funds){
    // 	return filterFunds(funds);
    // })
    .each(function(fund){
    	fc.downloadFundFile(fund);
    });
};





//TODO: not finished... parse query results, sort by instrument type, write csv
exports.dumpFunds = function(body, year, quarter, fund_number){

	readGoogleDocsFundsFile()
	.then(function(allFunds){
		

		body = 'Migdal';
		year = '2014';
		quarter = '2';
		fund_number = '659';

		//TODO: get chosen attributes from user
		var chosenFunds = allFunds.filter(function(f){
			return (body == undefined? true: f.body == body ||  ( _.isArray(body) && body.indexOf(f.body) > -1 ) ) 
			&& (fund_number == undefined ? true: f.number == fund_number ||  ( _.isArray(fund_number) && fund_number.indexOf(f.number) > -1 ))
			&& (year == undefined ? true: f.year == year ||  ( _.isArray(year) && year.indexOf(f.year) > -1 ))
			&& (quarter == undefined? true: f.quarter == quarter ||  ( _.isArray(quarter) && quarter.indexOf(f.quarter) > -1 ))
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

		var fundObj = Utils.getFundObj(managing_body, report_year, report_qurater, fund);
		var filename = Utils.filename("./from_db", fundObj, ".csv");

		console.log(rows);

		console.log("=============================")

		CSVWriter.write(managing_body, fund, report_year, report_qurater, instrument, instrumentSub, tabData, headers)
		return;

	});
	
};

exports.readGoogleDocsFundsFile = readGoogleDocsFundsFile;