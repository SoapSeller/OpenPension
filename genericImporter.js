var MetaTable = require('./common/MetaTable'),
	xlsx = require("./xlsxparser"),
	LevDistance = require('./LevDistance'),
	path = require('path'),
	logger = require('./logger.js')(module),
	detectors = require("./detectors");

var metaTable = MetaTable.getMetaTable();

exports.parseXls = function(filename){
	return xlsx.getSheets(filename)
	.then(function(workbook){
		var result = parseSheets(workbook);
		return result;
	})
	.catch(function(e){
		console.log(e);
		logger.error("genericImporter:" + e.stack);
	})
}


var columnLetterFromNumber = function(number){

	var enStart = 65;
	var enEnd = 90;
	var enDiff = enEnd - enStart;
	
	var remainder = (number <= enDiff) ? null : columnLetterFromNumber( Math.floor( number / enDiff ) -1 );
	
	if (number == enDiff) { var thisLetterNum = number }
	else if (number > enDiff)  { var thisLetterNum = number % enDiff -1 }
	else var thisLetterNum = number
	
	var thisLetter = String.fromCharCode(enStart + thisLetterNum)

	if (remainder) 
		return remainder + thisLetter
	else 
		return thisLetter
}


/* CONFIGURATION */
global.debug = true;

var levTolerance = 2;
var aliasMap = {
	"סוג מטבע" : [ "מטבע" ],
	"שם נייר ערך" : [ "מזומנים ושווי מזומנים","שם ני''ע", "סוג נכס", "שם" ],
	"שיעור מנכסי ההשקעה" : [ "שיעור מנכסי הקרן", "שיעור מהנכסים" ],
	"מספר נייר ערך" : [ "מספר ני\"ע", "מס' נייר ערך" ],
	"שיעור מהערך הנקוב המונפק" : [ "שיעור מהע.נ המונפק", "שיעור מהע.נ המונפק" ],
	"שווי הוגן" : [ "שווי שוק", "שווי השקעה", "שווי הוגן באלפי ש\"ח","עלות מתואמת", "שווי הוגן באלפי  ₪" ],
	"שווי שוק" : [ "שווי הוגן", "שווי שוק באלפי  ₪" ],
	"תשואה לפדיון" : [ "ת. לפדיון" ],
	"שיעור ריבית": [ "תנאי ושיעור ריבית","שיעור ריבית ממוצע" ],
	"שיעור מהערך הנקוב המונפק" : [ "שעור מערך נקוב מונפק" ]
}

var detectorsMap = {
	"שם נייר ערך" : [ "ב. ניירות ערך סחירים","בישראל","סעיף 1. נכסים המוצגים לפי שווי הוגן:","בישראל:","בחו\"ל:","ישראל","חו\"ל"]
}



var knownSheetContentIdentifiers = {
	1 : ["מזומנים ושווי מזומנים"],
	2 : [ "תעודות התחייבות ממשלתיות" ],
	4 : [ "אגח קונצרני","אג\"ח קונצרני" ],
	14 : [ "אגח קונצרני","אג\"ח קונצרני" ]

}

/* DATA MANIPULATION */


var findFromAliasMap = function(input, headers, headersAliasMap){
	var res = headers.filter( function(h){
		if (headersAliasMap[h]){
			return headersAliasMap[h].some(function(ah){
				var _ah = detectors.cleanColumnHeaderStr(ah);
				return input == _ah;
			});
		} else {
			return false;
		}
	});

	if (res.length > 0){
		return res[0]
	} else {
		return null
	}
}

var findFromHeadersLev = function(input, headers){
	var _levTolerance = input.length <= 3 ? 1 : levTolerance;
	var res = headers.filter(function(h){
		var _h = detectors.cleanColumnHeaderStr(h);
		if (LevDistance.calc(_h,input) <= _levTolerance){
			return h;
		} else {
			return false;
		}
	});

	if (res.length > 0){
		return res[0];
	} else {
		return null;
	}
}

var findFromAliasMapLev = function(input, headers, headersAliasMap){
	var _levTolerance = input.length <= 3 ? 1 : levTolerance;
	var res = headers.filter( function(h){
		if (headersAliasMap[h]){
			return headersAliasMap[h].some(function(ah){
				var _ah = detectors.cleanColumnHeaderStr(ah);
				return LevDistance.calc(_ah,input) <= _levTolerance;
			});
		} else {
			return false;
		}
	});

	if (res.length > 0){
		return res[0];
	} else {
		return null;
	}
};


var findInHeaders = function(headers, cellContent){
	var _cleanCell = detectors.cleanColumnHeaderStr(cellContent);

	if (headers.indexOf(_cleanCell) > -1) {
		return _cleanCell;
	} else {
		var headerFromAliasMap = findFromAliasMap(_cleanCell, headers,aliasMap);
		if (headerFromAliasMap){
			return headerFromAliasMap;
		} else {
			var headerFromHeaderLev = findFromHeadersLev(_cleanCell, headers);
			if (headerFromHeaderLev) {
				return headerFromHeaderLev;
			} else {
				return findFromAliasMapLev(_cleanCell, headers,aliasMap);
				
			}
		}
	}
};


/*
mutates the input foundHeadersMapping
returns true if should extract content
*/
var headersExtractor = function(inputLine, headers, foundHeadersMapping){

	if (foundHeadersMapping.length == headers.length)
		return true;


	var isLookingForHeaderLine = foundHeadersMapping.length == 0;

	if (isLookingForHeaderLine){
		var foundFromHeader = inputLine.reduce(function(res, cellContent, column){
			if (cellContent){

				var remainingHeaders = headers.filter( function(h){
					return !foundHeadersMapping.some(function(fh){ return h.foundCell == h; })
				});

				var foundInHeader = findInHeaders(remainingHeaders, cellContent);

				if (foundInHeader) {
					if (global.debug){
						logger.debug({ column: column, origCell: cellContent, foundCell: foundInHeader })
					}
					res.push({ column: column, origCell: cellContent, foundCell: foundInHeader });
				}
			} 

			return res;
			
		},[]);

		foundFromHeader.forEach(function(fhm){
			if (global.debug){
				logger.debug("headersExtractor","matched header from header line:", fhm.foundCell, " original content:",fhm.origCell);
			}
			foundHeadersMapping.push(fhm)
		});

	} else {

		var knownColumns = foundHeadersMapping.map(function(fhm){ return fhm.column; });
		var knownHeaders = foundHeadersMapping.map(function(fhm){ return fhm.foundCell; });
		var remainingHeaders = headers.filter(function(h){ return knownHeaders.indexOf(h) == -1 })

		var foundFromData = inputLine.reduce(function(res,cellContent, column){
			if (cellContent && knownColumns.indexOf(column) == -1){
				remainingHeaders.some(function(rh){
					if (rh == cellContent.trim() || detectorsMap[rh] && detectorsMap[rh].some(function(dtc){ return dtc == cellContent.trim(); })){
						res.push({ column: column, origCell: cellContent, foundCell: rh });
						return true;
					} else {
						return false;
					}
				})
			} 

			return res;
			
		},[])

		if (foundFromData.length > 0){
			foundFromData.forEach(function(ffd){
				if (global.debug){
					logger.debug("headersExtractor","* matched header from content:", ffd.foundCell, " original content:",ffd.origCell);
				}
				foundHeadersMapping.push(ffd);
			});

			foundHeadersMapping.sort(function(h1,h2){ return h1.column - h2.column; });

		}

	}

	if (foundHeadersMapping.length == 1){
		if (global.debug){
			logger.debug("headersExtractor","false positive on header row, emptying results");
		}
		foundHeadersMapping.splice(0,1);
		return false;
	} else if (foundHeadersMapping.length > 1 && isLookingForHeaderLine){
		if (global.debug){
			logger.debug("headersExtractor","positive match for header line!");
		}
		return false;
	} else if (foundHeadersMapping.length == 0){
		return false;
	} else {
		return true;
	}

}

var contentExtractor = function(inputLine, headersMapping){

	extractColumns = headersMapping.map(function(hm){return hm.column});

	return inputLine.reduce(function(res,cellContent,column){
		if (extractColumns.indexOf(column) >= 0){
			res.push(cellContent);
		} 
		return res;
		
	},[]);

}

var sheetValidator = function(headers, foundHeadersMapping){
	if (global.debug){
		logger.debug("sheetValidator", "found headers #", foundHeadersMapping.length, "num headers", headers.length)
	}
	return (
		(foundHeadersMapping.length == headers.length) ||
		(foundHeadersMapping.length > 5 && foundHeadersMapping.length >= headers.length / 3  ) ||
		(headers.length - foundHeadersMapping.length <= Math.ceil(headers.length / 0.3))
	);
}

var parseSingleSheet = function(workbook, sheetName, dim, tabIndex){
	var foundMatchingSheet = false;

	var headers = metaTable.getHeadersForTab(tabIndex).map(function(x){return x});
	var identifiedSheetIndexFromTabName = sheetSkipDetector([sheetName], tabIndex);

	if (global.debug){
		logger.debug("identifiedSheetIndexFromTabName", identifiedSheetIndexFromTabName);
		logger.debug("parseSingleSheet", tabIndex);
		logger.debug("parseSingleSheet", "trying to match tab by sheet name",sheetName);
	}
	if (identifiedSheetIndexFromTabName != tabIndex){
		logger.debug("parseSingleSheet","identified different sheet by looking into tab name",
			tabIndex,"(" + metaTable.getNameForSheetNum(tabIndex) + ")", " identified as:", identifiedSheetIndexFromTabName, "("+metaTable.getNameForSheetNum(identifiedSheetIndexFromTabName)+")" );
		return parseSingleSheet(workbook, sheetName, dim, identifiedSheetIndexFromTabName);
	}

	if (global.debug){
		logger.debug("parseSingleSheet","headers",headers);
	}

	if (dim.max.col < headers.length){
		logger.debug("dim too small");
	}

	var sheetData = [];
	var foundHeadersMapping = [];
	var emptyRows = 0;

	for(var row = dim.min.row || 1; row <= dim.max.row; row++){
	

		// if the number of empty rowns is above 10, the sheet is reporting a size which is too
		// big and needs to be trimmed
		if (emptyRows >= 20) 
			break;
		
		var rowContent = []

		for (var column = dim.min.col || 0; column <= dim.max.col; column++){
			var letter = columnLetterFromNumber(column);		
			var cellId = letter + row;
			
			var cellContent = xlsx.readCell(workbook, sheetName, cellId);
			rowContent[column] = cellContent;
		}

		if (global.debug){
			logger.debug("parseSingleSheet","row",rowContent.join("|"));
		}

		if (rowContent.some(function(x){return !!x})) {
			emptyRows = 0;
		} else {
			emptyRows += 1;
		}

		var shouldExtractContent = headersExtractor(rowContent,headers, foundHeadersMapping)

		// Allow looking few lines after the headers line to detect the correct sheet
		if ((tabIndex != 0 && tabIndex != 1) && (!shouldExtractContent ||  sheetData.length < 4)) {
			var identifiedSheetIndex = sheetSkipDetector(rowContent, tabIndex);
			if (identifiedSheetIndex != tabIndex){
				logger.debug("parseSingleSheet","identified different sheet while looking for:",
					tabIndex,"(" + metaTable.getNameForSheetNum(tabIndex) + ")", " identified as:", identifiedSheetIndex, "("+metaTable.getNameForSheetNum(identifiedSheetIndex)+")" );
				return parseSingleSheet(workbook, sheetName, dim, identifiedSheetIndex);
			}
		}

		if (shouldExtractContent){
			var extractedData = contentExtractor(rowContent,foundHeadersMapping);
			if (global.debug){
				logger.debug("parseSingleSheet","extracted data",extractedData.join(","))
			}
			sheetData.push(extractedData);
		}
		
	}

	var sheetMatchVerified = sheetValidator(headers,foundHeadersMapping);
	
	if (sheetMatchVerified){
		if (global.debug){
			logger.debug("parseSingleSheet","verified positive match for sheet!");
		}
		return {"data":sheetData,"finalIndex":tabIndex,"headers":foundHeadersMapping.map(function(hm){ return hm.foundCell; })};
	} else {
		if (global.debug){
			logger.debug("parseSingleSheet","negative match for sheet...");
		}
		return null;
	}
}


var sheetMetaIdentifier = function(cellContent, metaSheetNum, metaTable){

	var nameFromMetaTable = metaTable.instrumentSubTypes[metaSheetNum] || metaTable.instrumentTypes[metaSheetNum];
	
	var cleanCellContent = detectors.cleanColumnHeaderStr(cellContent);
	var options = [nameFromMetaTable].concat(knownSheetContentIdentifiers[metaSheetNum] || []);
	return options.some(function(value){ return cleanCellContent == detectors.cleanColumnHeaderStr(value) })

}

var sheetSkipDetector = function(inputLine, metaSheetNum){
	logger.debug("sheetSkipDetector","inputLine" + inputLine);
	logger.debug("sheetSkipDetector","metaSheetNum" + metaSheetNum);

	// for the first two tabs, skip detection
	return inputLine.reduce(function(_metaSheetNum, cellContent){
		if (_metaSheetNum == metaSheetNum) {
			var i = _metaSheetNum + 1;
			for (i = _metaSheetNum; i < metaTable.instrumentTypes.length ; i++){
				if (sheetMetaIdentifier(cellContent, i, metaTable)){
					if (global.debug){
						logger.debug("sheetSkipDetector","matched to meta sheet #" + i);
					}
					return i;
				}
			}
			return metaSheetNum;
		} else {
			return _metaSheetNum
		}
	},metaSheetNum);
}


var parseSheets = function(workbook){

	var metaTable = MetaTable.getMetaTable();
	var lastSheetNum = metaTable.getLastSheetNum();
	var debugSheet;
	var parsedSheetsData = []
	var res = []
	var _sheets = workbook.SheetNames.map(function(x){return x});
	var maxSheets = 25;
	
	while (res.length < /*lastSheetNum*/ maxSheets && _sheets.length > 0){
		var sheetTabNum = workbook.SheetNames.length - _sheets.length;

		if (debugSheet != null && debugSheet == sheetTabNum ) {
			global.debug = true;
		}

		if (global.debug)
			logger.debug("%%%%%% parsing file tab #",sheetTabNum, " looking for meta table #", res.length, "called", metaTable.getNameForSheetNum(res.length));

		var sheetName = _sheets.shift();

		var dim = xlsx.getDimension(workbook, sheetName);

		logger.debug("parseSheets","sheet dim",dim)

		var sheetOutput = parseSingleSheet(workbook,sheetName,dim,res.length);

		if (sheetOutput && sheetOutput.finalIndex != res.length){
			while(res.length < sheetOutput.finalIndex){
				if (global.debug){
					logger.debug("lookForNextSheet","padding output array with empty data to match expected progress of meta table idx")
				}
				res.push([]);
			}
		}

		if (sheetOutput && sheetOutput.data && sheetOutput.data.length > 0){
			if (global.debug){
				logger.debug("parseSheets","adding sheet lines count #",sheetOutput.data.length);
			}
			res.push(sheetOutput);
		}
		
		if ( debugSheet != null && debugSheet == sheetTabNum ) {
			process.exit();
		}

	}


	logger.info("++++++ parsed & found all sheets");

	res.forEach(function(resSheet, metaIdx){
		if (resSheet.headers && resSheet.data){
			var engMap = resSheet.headers.map(function(column){ return { "columnName" : metaTable.englishColumns[ metaTable.hebrewColumns.indexOf(column) ] || column }  });
			parsedSheetsData.push({engMap : engMap, data: resSheet.data, idx: metaIdx})
		}
	});

	return parsedSheetsData;
}


