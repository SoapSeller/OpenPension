var URL = require("url"),
	http = require("http"),
	https = require("https"),
	fs = require("fs"),
	cp = require("child_process");

var cUrl = 3,
	cNum = 2,
	cBody = 0;

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

			if (body.indexOf("מגדל") != -1) {
				body = "migdal";
			} else if (body.indexOf("מנורה") != -1) {
				body = "menora";
			} else if (body.indexOf("פניקס") != -1) {
				body = "fenix";
			} else {
				continue;
			}

			funds.push({
				body: body,
				number: splt[cNum],
				url: url
			});
		}
	}

	return funds;
};

var fetchFund = function(fund, onDone) {
	if (fund.url.indexOf('http') !== 0) {
		fund.url = 'http://' + fund.url;
	}

	url = URL.parse(fund.url);

	var isHttps = url.protocol == "https:";
	var options = {
		hostname: url.hostname,
		port: url.port ? url.port : (isHttps ? 443 : 80),
		path: url.path,
		method: 'GET'
	};

	var baseName = "res/" + fund.body + "_" + fund.number;
	var filename = baseName + ".xls";
	var filenameX = baseName + ".xlsx";

	var stream = fs.createWriteStream(filename, { flags: 'w+', encoding: "binary", mode: 0666 });

	var client = isHttps ? https : http;

	var req = client.request(options, function(res) {
		//res.setEncoding('binary');
		res.on('data', function (chunk) {
			stream.write(chunk);
		});
		res.on('end', function() {
			//stream.end();

			cp.exec("file " + filename, function (err, stdout, stderr) {
				if (!err &&
					(stdout.toString().indexOf("CDF V2") !== -1 ||
					 stdout.toString().indexOf("Composite Document File V2 Document") !== -1)) {
					var cmd = "ssconvert --export-type=Gnumeric_Excel:xlsx " + filename + " " + filenameX;
					cp.exec(cmd, function(err, stdout, stderr) {
						//console.log(cmd);
						//console.log(stdout);
						fs.unlink(filename);
						onDone();
					});
				}
				else {
					console.log("Error with fund: ", fund, stdout);
					fs.unlink(filename);
					onDone();
				}
			});
		});
	});

	req.on('error', function(e) {
		console.log('problem with request(' + fund.url +  '): ' + e.message, options);
		onDone();
	});

	req.end();
};


var doFetch = function(step, funds, seed) {
	if (seed < funds.length) {
		fetchFund(funds[seed], doFetch.bind(this, step, funds, seed+step));
	}
};

exports.fetchAll = function() {
	var funds = readFundsFile();

	var step = 20;
	for(var i = 0; i < Math.min(funds.length, step); ++i) {
		doFetch(step, funds, i);
	}
};

