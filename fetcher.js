var URL = require("url"),
	http = require("http"),
	https = require("https"),
	fs = require("fs"),
	cp = require("child_process");

var cUrl = 3,
	cNum = 2,
	cBody = 0;

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
	"הסוכנות היהודית": "hasochnut"
};

var parseBody = function(body) {
	for (var k in bodys) {
		if (body.indexOf(k) != -1) {
			return bodys[k];
		}
	}

	return null;
};

/* Read & parse funds.csv file */
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

			var englishBody = parseBody(body);

			if (englishBody === null) {
				console.log(body);
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

/* fetch a fund to file
 * fund: Object of type:
 *					{ body: englishBody, // See 'bodys' aboce
 *					  number: number,
 *					  url: fileurl }
 *  onDone: Callback with format void(downloadedFilePath, error)
 */
var fetchFund = function(fund, onDone) {

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
						fs.unlink(filename);
						onDone(filenameX);
					});
				}
				else {
					console.log("Error with fund: ", fund, stdout);
					fs.unlink(filename);
					onDone(null, "Can't convert fund: " + stdout);
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


var doFetch = function(step, funds, seed) {
	if (seed < funds.length) {
		fetchFund(funds[seed], doFetch.bind(this, step, funds, seed+step));
	}
};

/* Fetch all funds */
exports.fetchAll = function() {
	var funds = readFundsFile();

	var step = 5;
	for(var i = 0; i < Math.min(funds.length, step); ++i) {
		doFetch(step, funds, i);
	}
};

