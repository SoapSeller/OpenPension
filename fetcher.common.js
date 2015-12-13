var URL = require("url"),
	http = require("http"),
	https = require("https"),
	fs = require("fs"),
	Promise = require("bluebird"),
	CSVWriter = require('./CSVWriter.js'),
	utils = require("./utils.js"),
	path = require("path");



//downloadFundFile
exports.downloadFundFile = function(fund, trgdir) {

	console.log('--> fetch fund');


	return new Promise(function(resolve, reject){

		var url = URL.parse(fund.url);
		var ext = path.extname(fund.url);
		var xlFilename = utils.filename(trgdir, fund, ext);


		if (fs.existsSync(xlFilename)){
			console.log("tried to fetch existing file: " + xlFilename);
			return resolve(xlFilename);
		}

		
		if (fund.url.indexOf('http') !== 0) {
			console.log("Malformed URL");
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

			//check HTTP status code
			if ( String(res.statusCode).charAt(0) !== '2'){
				console.log("Fund: " + [fund.body, fund.year, fund.quarter, fund.number].join("_") + "\nError downloading file from " + fund.url + " StatusCode: " + res.statusCode);
				return reject("Fund: " + [fund.body, fund.year, fund.quarter, fund.number].join("_") + "\nError downloading file from " + fund.url + " StatusCode: " + res.statusCode);
			}

			console.log("got response: "+ ext);

			if (ext.indexOf("xls") == -1){
				var httpExt = getExtFromHttpResponse(res);

				console.log("got httpExt: "+httpExt);
				
				if (httpExt != undefined){
					xlFilename = utils.filename(trgdir, fund, httpExt);
					ext = httpExt;
				}
				else{
					return reject();
				}
			
			}

			if (fs.existsSync(xlFilename)){
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



function getExtFromHttpResponse(res){

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

