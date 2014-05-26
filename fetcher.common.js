var URL = require("url"),
	http = require("http"),
	https = require("https"),
	fs = require("fs"),
	fs = require("fs"),
	cp = require("child_process");

/* fetch a fund to file
 * fund: Object of type:
 *					{ body: englishBody, // See 'bodys' aboce
 *					  number: number,
 *					  url: fileurl }
 *  onDone: Callback with format void(downloadedFilePath, error)
 */
exports.fetchFund = function(fund, onDone) {

	if (fund.url.indexOf('http') !== 0) {
		fund.url = 'http://' + fund.url;
	}

	//console.log(fund.url);
	url = URL.parse(fund.url);

	var isHttps = url.protocol == "https:";
	var options = {
		hostname: url.hostname,
		port: url.port ? url.port : (isHttps ? 443 : 80),
		path: url.path,
		method: 'GET',
		rejectUnauthorized: false
	};

	var baseName = "res/" + fund.body;
	if (fund['year']) {
		baseName += "_" + fund.year;
	}
	if (fund['quarter']) {
		baseName += "_" + fund.quarter;
	}
    baseName += "_" + fund.number;
	var filename = baseName + ".xls";
	var filenameX = baseName + ".xlsx";


	if (fs.existsSync(filenameX)){
		console.log("skipping existing file " + filenameX);
		require("child_process").exec("node index import -f " + filenameX
			+ " -y " + fund.year + " -q " + fund.quarter + " -b " + fund.body + " -m " + fund.number, function(e){
			onDone(filenameX);
		});
		return;
	}

	var stream = fs.createWriteStream(filename, { flags: 'w+', encoding: "binary", mode: 0666 });

	var client = isHttps ? https : http;

	var req = client.request(options, function(res) {
		//res.setEncoding('binary');
		res.on('data', function (chunk) {
			stream.write(chunk);
		});
		res.on('end', function() {
			stream.end();


			cp.exec("file " + filename, function (err, stdout, stderr) {
				if (!err &&
					(stdout.toString().indexOf("CDF V2") !== -1 ||
					stdout.toString().indexOf("Composite Document File V2 Document") !== -1)) {
					var cmd = "ssconvert --export-type=Gnumeric_Excel:xlsx " + filename + " " + filenameX;
					//console.log(filename);

					cp.exec(cmd, function(err, stdout, stderr) {
						//console.log(cmd);
						//console.log(stdout);
						fs.unlink(filename, function() {
    						require("child_process").exec("node index import -f " + filenameX
    							+ " -y " + fund.year + " -q " + fund.quarter + " -b " + fund.body + " -m " + fund.number, function(e){
    							onDone(filenameX);
    						});
                        });
					});
				} else if (stdout.toString().indexOf("Zip archive data, at least v2.0 to extract") !== -1) {
					// File is already xlsx, just move it to the right name
					cp.exec("mv -f " + filename + " " + filenameX, function(err, stdout, stderr) {
						//console.log(cmd);
						//console.log(stdout);
						require("child_process").exec("node index import -f " + filenameX
							+ " -y " + fund.year + " -q " + fund.quarter + " -b " + fund.body + " -m " + fund.number, function(e){
							onDone(filenameX);
						});
					});
				} else {
					console.log("Error with fund: ", fund, stdout);
					fs.unlink(filename, function() {
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
