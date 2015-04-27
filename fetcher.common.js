var URL = require("url"),
	http = require("http"),
	https = require("https"),
	fs = require("fs"),
	CSVWriter = require('./CSVWriter.js'),
	utils = require("./utils.js"),
	path = require("path");


var baseFolder = "res/";
var targetFolder = "tmp/";

exports.changeBaseFolder = function(newFolder){ baseFolder = newFolder; console.log("changing to folder:",newFolder); };

/* fetch a fund to file
 * fund: Object of type:

 *					{ body: englishBody, // See 'bodys' above
 *					  number: number,
 *					  url: fileurl }
 *  onDone: Callback with format void(downloadedFilePath, error)
 */


function importFund(fund, ext){

	var csvFilename = utils.filename(targetFolder, fund, ".csv");
	var xlFilename = utils.filename(baseFolder, fund, ext);

	console.log("csvFilename"+csvFilename);

	if (fs.existsSync(csvFilename)){
		console.log("skipping existing file: " + csvFilename);
		return;
	}

	var exists = fs.existsSync(csvFilename);

	if (exists){
		console.log("tried to import existing file:" + filename );
		return;
	}

	return require('./genericImporter').parseXls(xlFilename)
	.then(function(result){
		return CSVWriter.writeParsedResult(fund.body, fund.number, fund.year, fund.quarter, result);
	})
	.catch(function(e){
		console.log("fetcher.common.js: " + e);
	});

}

var dedup = []


exports.fetchFund = function(fund, onDone) {

	console.log('--> fetch fund')

	var url = URL.parse(fund.url);
	var ext = path.extname(fund.url);
	var xlFilename = utils.filename(baseFolder, fund, ext);

	if (dedup.indexOf(url) > -1 ){ 
        return onDone(null, "tried to fetch already fetched url: " + url);

	}
	else{
		dedup.push(url);
	}


	if (fs.existsSync(xlFilename)){
		console.log("tried to fetch existing file: " + xlFilename);

		return importFund(fund, ext, onDone);
	}

	
	if (fund.url.indexOf('http') !== 0) {
		fund.url = 'http://' + fund.url;
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

 			importFund(fund, ext, onDone);

		});
	});

	req.on('response',  function (res) {

		console.log("got response: "+ ext);

		if (ext.indexOf("xls") == -1){
			var httpExt = getExtByHttpResponse(res);

			console.log("got httpExt: "+httpExt);
			
			if (httpExt != undefined){
				xlFilename = utils.filename(baseFolder, fund, httpExt);
				ext = httpExt;
			}
			else{
				return onDone();
			}
		
		}


		if (fs.existsSync(xlFilename)){
			console.log("tried to fetch existing file: " + xlFilename);
		//	return onDone();
			return importFund(fund, ext, onDone);
		}

		console.log('fetching ' + xlFilename );
		res.pipe(fs.createWriteStream(xlFilename, { flags: 'w+', encoding: "binary", mode: 0666 }));
	});

	req.on('error', function(e) {
		console.log('problem with request(' + fund.url +  '): ' + e.message, options);
		onDone(null, "Can't fetch fund: "  + e.message);
	});

	req.end();
};


function getExtByHttpResponse(res){

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

exports.fetchFunds = function(funds, onDone) {
	if (funds.length === 0) {
		return;
	}
	//var count = funds.length;
	var handleDone = function() {
		//--count;
		funds.pop();
		//if (count === 0) {
		if (funds.length === 0) {
			onDone();
		} else {
			exports.fetchFund(funds[funds.length-1], handleDone);
		}
	};


	exports.fetchFund(funds[funds.length-1], handleDone);
};

exports.importFund = importFund;