var URL = require("url"),
	http = require("http"),
	https = require("https"),
	fs = require("fs"),
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

function filename(folder, fund, ext){
	var baseName = baseFolder + [fund.body, fund.year, fund.quarter, fund.number].join("_");


    return baseName + ext;    	

}


function filenameCSV(fund){
	return [ fund.body, fund.number, fund.year, fund.quarter].join("_") + ".csv";
}
var CSVWriter = require('./CSVWriter')

function importFund(fund, ext, onDone){

	var csvFilename = filename(targetFolder, fund, ".csv");
	var xlFilename = filename(baseFolder, fund, ext);

	console.log("csvFilename"+csvFilename);

	if (fs.existsSync(csvFilename)){
		console.log("skipping existing file: " + csvFilename);
		return onDone();
	}


	require("child_process").exec("node index import -f " + xlFilename
                + " -y " + fund.year + " -q " + fund.quarter + " -b " + fund.body + " -m " + fund.number
    	,function(e){
			if (e) console.log(e);
            onDone(xlFilename);
		}
	);
}

var dedup = []


exports.fetchFund = function(fund, onDone) {

	var url = URL.parse(fund.url);
	var ext = path.extname(fund.url);
	var xlFilename = filename(baseFolder, fund, ext);

	if (dedup.indexOf(xlFilename) > -1 ){ 
        return onDone(null, "tried to fetch existing file" + filename(fund));

	}
	else{
		dedup.push(xlFilename);
	}


	if (fs.existsSync(xlFilename)){
		console.log("tried to fetch existing file" + xlFilename);
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

	var stream = fs.createWriteStream(xlFilename, { flags: 'w+', encoding: "binary", mode: 0666 });

	var client = isHttps ? https : http;

	var req = client.request(options, function(res) {
		//res.setEncoding('binary');
		res.on('data', function (chunk) {
			stream.write(chunk);
		});
		res.on('end', function() {
			stream.end();

			importFund(fund, ext, onDone);

		});
	});

	req.on('error', function(e) {
		console.log('problem with request(' + fund.url +  '): ' + e.message, options);
		onDone(null, "Can't fetch fund: "  + e.message);
	});

	req.end();
};

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
