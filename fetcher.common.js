var URL = require("url"),
	http = require("http"),
	https = require("https"),
	fs = require("fs"),
	cp = require("child_process");


var baseFolder = "res/";

exports.changeBaseFolder = function(newFolder){ baseFolder = newFolder; console.log("changing to folder:",newFolder); };

/* fetch a fund to file
 * fund: Object of type:
 *					{ body: englishBody, // See 'bodys' aboce
 *					  number: number,
 *					  url: fileurl }
 *  onDone: Callback with format void(downloadedFilePath, error)
 */

function filename(fund){
	var baseName = baseFolder + fund.body;
        if (fund['year']) {
                baseName += "_" + fund.year;
        }
        if (fund['quarter']) {
                baseName += "_" + fund.quarter;
        }
    	baseName += "_" + fund.number;
        return baseName + ".xls";
}

function filenameX(fund){
	return filename(fund) + "x";
}

function importFund(fund, onDone){
	require("child_process").exec("node index import -f " + filenameX(fund)
                + " -y " + fund.year + " -q " + fund.quarter + " -b " + fund.body + " -m " + fund.number, function(e){
		if (e) console.log(e);
                onDone(filenameX(fund));
         });
}

var dedup = []


exports.fetchFund = function(fund, onDone) {

	if (dedup.indexOf(filename(fund)) > -1) 
		return onDone(null, "tried to fetch existing file" + filename(fund));
	else
		dedup.push(filename(fund));


	if (fund.url.indexOf('http') !== 0) {
		fund.url = 'http://' + fund.url;
	}

	//console.log(fund.url);
	url = URL.parse(fund.url);

	var isHttps = url.protocol == "https:";
	var options = {
		hostname: url.hostname,
		headers: {'user-agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/535.11 (KHTML, like Gecko) Chrome/17.0.963.79 Safari/535.11'},
		port: url.port ? url.port : (isHttps ? 443 : 80),
		path: url.path,
		method: 'GET',
		rejectUnauthorized: false
	};


	if (fs.existsSync(filenameX(fund))){
		console.log("skipping existing file " + filenameX(fund));
		return importFund(fund, onDone);
	}

	var stream = fs.createWriteStream(filename(fund), { flags: 'w+', encoding: "binary", mode: 0666 });

	var client = isHttps ? https : http;

	var req = client.request(options, function(res) {
		//res.setEncoding('binary');
		res.on('data', function (chunk) {
			stream.write(chunk);
		});
		res.on('end', function() {
			stream.end();


			cp.exec("file " + filename(fund), function (err, stdout, stderr) {
				if (!err &&
					(
						stdout.toString().indexOf("CDF V2") !== -1 ||
						stdout.toString().indexOf("Composite Document File V2 Document") !== -1 ||
						stdout.toString().indexOf("Microsoft Excel 2007+") !== -1
					)) {
					var cmd = "ssconvert --export-type=Gnumeric_Excel:xlsx " + filename(fund) + " " + filenameX(fund);
					//console.log(filename);

					cp.exec(cmd, function(err, stdout, stderr) {
						if (err){
							console.error(err);
						}
						//console.log(cmd);
						//console.log(stdout);
						fs.unlink(filename(fund), function() {
							importFund(fund, onDone);
                        			});
					});
				} else if (stdout.toString().indexOf("Zip archive data, at least v2.0 to extract") !== -1) {
					// File is already xlsx, just move it to the right name
					cp.exec("mv -f " + filename(fund) + " " + filenameX(fund), function(err, stdout, stderr) {
						//console.log(cmd);
						//console.log(stdout);
						importFund(fund, onDone);
					});
				} else {
					console.log("Error with fund: ", fund, stdout);
					fs.unlink(filename(fund), function() {
    			                    onDone(null, "Can't convert fund: " + stdout);
			                });
				}
			});
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
