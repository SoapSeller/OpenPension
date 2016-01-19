var URL = require("url"),
	http = require("http"),
	https = require("https"),
	fs = require("fs"),
	Promise = require("bluebird"),
	CSVWriter = require('./CSVWriter.js'),
	utils = require("./utils.js"),
	path = require("path");

//downloadFundFile
exports.downloadFundFile = function(fund, trgdir, overwrite) {

	console.log('--> fetch fund');


	return new Promise(function(resolve, reject){

		var url = URL.parse(fund.url);
		var urlExt = path.extname(fund.url); //get extention from URL
		var xlFilename = utils.filename(trgdir, fund, urlExt);

		if (!overwrite &&  exports.excelFileExists(trgdir, fund)){
			console.log("tried to fetch existing file: " + xlFilename);
			return resolve(xlFilename);
		}

		
		if (fund.url.indexOf('http') !== 0) {
			console.log("Malformed URL:" + fund.url);
			reject("Malformed URL");
		}

		var isHttps = url.protocol == "https:";
		var options = {
			hostname: url.hostname,
			headers: {'user-agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/535.11 (KHTML, like Gecko) Chrome/17.0.963.79 Safari/535.11'},
			port: url.port ? url.port : (isHttps ? 443 : 80),
			path: url.path,
			method: 'GET',
			rejectUnauthorized: false
		};


		var client = isHttps ? https : http;

		var req = client.request(options, function(res) {

			res.on('end', function() {

				return resolve(xlFilename);

			});
		});

		req.on('response',  function (res) {

			//check HTTP status code is 2xx
			if ( String(res.statusCode).charAt(0) !== '2'){
				console.log("Fund: " + [fund.body, fund.year, fund.quarter, fund.number].join("_") + "\nError downloading file from " + fund.url + " StatusCode: " + res.statusCode);
				return reject("Fund: " + [fund.body, fund.year, fund.quarter, fund.number].join("_") + "\nError downloading file from " + fund.url + " StatusCode: " + res.statusCode);
			}

			console.log("got response: "+ urlExt); //ext by url

			if (urlExt.indexOf("xls") == -1){
				var contentTypeExt = getExtByResponseContentType(res);

				console.log("ext by response content type: "+contentTypeExt);
				
				if (contentTypeExt != undefined){
					xlFilename = utils.filename(trgdir, fund, contentTypeExt);
				}
				else{
					return reject();
				}

			}

			if (!overwrite && fs.existsSync(xlFilename)){
				console.log("tried to fetch existing file: " + xlFilename);
				return resolve(xlFilename);
			}

			console.log('fetching ' + xlFilename );
			res.pipe(fs.createWriteStream(xlFilename, { flags: 'w+', encoding: "binary", mode: 0666 }));
		});

		req.on('error', function(e) {
			console.log('problem with request(' + fund.url +  '): ' + e.message, options);
			return reject('problem with request(' + fund.url +  '): ' + e.message);
		});

		req.end();

	});
	
};



function getExtByResponseContentType(res){

	var attachment = res.headers['content-disposition'];
	var contentType = res.headers['content-type'];
	var ext;
	
	if (attachment != undefined && attachment.indexOf("filename")){
		ext = path.extname(attachment);
	}
	else if (contentType != undefined){
		if (contentType == "application/vnd.ms-excel"){
			ext = ".xls";
		}
		else if (contentType == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"){
			ext = ".xlsx"
		}
		else{
			console.log("unknown contentType: "+ contentType);
		}
	}
	else{
		console.log("could not determine file name: "+ res);
	}

	return ext;
}


exports.excelFileExists = function(trgdir, fund){

	var xlsFilename = utils.filename(trgdir, fund, '.xls');
	var xlsxFilename = utils.filename(trgdir, fund, '.xlsx');
	return fs.existsSync(xlsFilename ) || fs.existsSync(xlsxFilename)
}
