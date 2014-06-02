
var zombie = require('zombie'),
	fc = require("./fetcher.common.js"),
	fs = require("fs"),
    urlParse = require("url").parse,
	levDist = require("./LevDistance.js").calc;


var baseUrl = "http://www.harel-gemel.co.il/";

var DEBUG = function(str) {
	//console.log("DEBUG", str);
};

var processsAssetsList = function(fund, browser, onDone, urlStr) {
    DEBUG("PROCESSING ASSETS LIST " + fund.number);
	var files = browser.document.querySelectorAll("a.AttFileGallery");

    var urlPrefix = baseUrl;
    if (urlStr !== undefined) {
        var parsed = urlParse(urlStr);
        urlPrefix = parsed.protocol + "//" + parsed.host + "/";
    }

	var processedFiles = [];
	for (var id in files) {
		//console.log(files[id].textContent, files[id].attributes.href.value);
		var file = files[id];
		if (file["attributes"] !== undefined && -1 != file.attributes.href.value.indexOf(".xls")) {
			var url = urlPrefix + "/" + file.attributes.href.value;
			var m = file.textContent.match(/\d+\/(\d+)\/(\d+)/);
            if (m === null) {
                var m = file.textContent.match(/\d+\.(\d+)\.(\d+)/);
            }
			if (m !== undefined) {
				var q = Math.floor((parseInt(m[1].substr(0,2), 10) -1) / 3) + 1;
				var year = m[2];
				processedFiles.push({ body: fund.body, number: fund.number, url: url, quarter: q, year: year});
				//console.log(url, q, year);
			} else { console.log("3333", m); }
		}
	}
    if (files.length === 0) {
        console.log("Unable to fetch fund: " + fund.number);
    }
    //onDone(fund, processedFiles);
	DEBUG("DONE " + fund.number);
	fc.fetchFunds(processedFiles, onDone);
    //onDone();
};

exports.fetchOne = function(fund, onDone) {
	DEBUG("START " + fund.number);
	var browser = new zombie();
	browser.debug = false;
	browser.runScripts = false; // this disables executing javascript

	browser.on("error", function(error) {
		console.error("Error with fund " + fund.number + ": ", error);
	});

    var cont = true;

	var fundName = "";
	browser.visit(baseUrl).then(function() {
		DEBUG("FIRST VISIT " + fund.number);
		// Search by fund number.
		browser.fill("input[name='SearchParam']", fund.number);
		return browser.pressButton("#image1");
	}).then(function() {
		// Click find the right found link in the results list & click it.
		DEBUG("AFTER SEARCH " + fund.number);
		var links = browser.document.querySelectorAll("a.SearchResult");
		for (var i = 0; i < links.length; ++i) {
			var link = links[i];
			if (link.childNodes.length > 0 && link.childNodes[0].nodeName == "#text" && link.childNodes[0].nodeValue.indexOf(fund.number) !== -1) {
				fundName = link.childNodes[0].nodeValue.replace(fund.number.toString(), "");
				return browser.clickLink(link);
			}
		}

		console.log("Fund " + fund.number + " was not found via search, going to try url(" + fund.url + ") instead.");
        return browser.visit(fund.url).then(function() {
            // We could try to check if the page is "OK" here, but we don't have really anything to do if it isn't, so just try to parse it.
            processsAssetsList(fund, browser, onDone, fund.url);
            cont = false;
        });
	}).then(function() {
        if (!cont) {
            return;
        }
		// Go to assets list
		DEBUG("FUND FOUND, GOING TO ASSETS LIST " + fund.number);
		return browser.clickLink("רשימות נכסים");
	}).then(function() {
        if (!cont) {
            return;
        }
		DEBUG("ASSETS LIST " + fund.number);
		if (browser.location.href.indexOf("ArticleID") == -1) {
			DEBUG("NOT FILE LIST, FIND THE RIGHT FUND");
			var lists = browser.document.querySelectorAll("a.ArticlesListTitle");

			var minDist = Number.MAX_VALUE;
			var bestLink = null;
			for (var id in lists) {
				var list = lists[id];
				if (list["attributes"] !== undefined && list.childNodes.length > 0) {
					var cleanLink = list.childNodes[0].nodeValue.replace("רשימות", "").replace("נכסים", "");
					var dist = levDist(fundName, cleanLink);
					if (dist < minDist) {
						minDist = dist;
						bestLink = list;
					}
				}
			}

			if (bestLink === null) {
                onDone();
				console.log("****Couldn't find files list for fund ", fund.number, "*****");
			} else {
				return browser.clickLink(bestLink);
			}
		}
	}).then(function() {
        if (!cont) {
            return;
        }
		DEBUG("YEAH! " + fund.number);
		processsAssetsList(fund, browser, onDone);
	});
};

var endFunc = function() {
	DEBUG("END");
};

//exports.fetchOne({ number: 566});
