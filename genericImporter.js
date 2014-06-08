var MetaTable = require('./common/MetaTable')
var xlsx = require("./xlsxparser");
var LevDistance = require('./LevDistance')

exports.parseXls = function(filename,callback){
	xlsx.getSheets(filename, function(sheets){
		var result = parseSheets(sheets);
		if (callback)
			callback(result)
	});
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
global.debug = false;
function debugM(name,message /*,...*/ ){
	if (global.debug){
		var args = Array.apply(null, arguments);
		console.log.apply(null,["#DEBUG",args.shift(),">"].concat(args));
	}
}

function notifyM(name, message /*,...*/){
	var args = Array.apply(null, arguments);
	console.log.apply(null, ["#NOTIFY", args.shift(),">"].concat(args));
}

var strictMode = false;
var levTolerance = 2;
var aliasMap = {
	"סוג מטבע" : [ "מטבע" ],
	"שם נייר ערך" : [ "מזומנים ושווי מזומנים","שם ני''ע", "סוג נכס" ],
	"שיעור מנכסי ההשקעה" : [ "שיעור מנכסי הקרן", "שיעור מהנכסים" ],
	"מספר נייר ערך" : [ "מספר ני\"ע", "מס' נייר ערך" ],
	"שיעור מהערך הנקוב המונפק" : [ "שיעור מהע.נ המונפק", "שיעור מהע.נ המונפק" ],
	"שווי הוגן" : [ "שווי שוק", "שווי השקעה", "שווי הוגן באלפי ש\"ח" ],
	"שווי שוק" : [ "שווי הוגן" ],
	"תשואה לפדיון" : [ "ת. לפדיון" ],
	"שיעור ריבית": [ "תנאי ושיעור ריבית","שיעור ריבית ממוצע" ],
	"שיעור מהערך הנקוב המונפק" : [ "שעור מערך נקוב מונפק" ]
}

var detectorsMap = {
	"שם נייר ערך" : [ "ב. ניירות ערך סחירים","בישראל","סעיף 1. נכסים המוצגים לפי שווי הוגן:" ]
}



var knownSheetContentIdentifiers = {
	1 : ["מזומנים ושווי מזומנים"],
	2 : [ "תעודות התחייבות ממשלתיות" ],
	4 : [ "אגח קונצרני","אג\"ח קונצרני" ],
	14 : [ "אגח קונצרני" ]

}

/* DATA MANIPULATION */

var cleanDataStr = function(inputStr){
	return inputStr;
}

var cleanColumnHeaderStr = function(inputStr){
	if (inputStr)
		return inputStr.replace(/\(.*\)/g,"").replace(/["'\n\r]/g,"").replace(/[ ]+/g," ").replace(/^.\. /,"").trim()
	else 
		return ""
}

var findFromAliasMap = function(input, headers, headersAliasMap){
	var res = headers.filter( function(h){
		if (headersAliasMap[h]){
			return headersAliasMap[h].some(function(ah){
				var _ah = cleanColumnHeaderStr(ah);
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
	var res = headers.filter(function(h){
		var _h = cleanColumnHeaderStr(h);
		if (LevDistance.calc(_h,input) <= levTolerance){
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
	var res = headers.filter( function(h){
		if (headersAliasMap[h]){
			return headersAliasMap[h].some(function(ah){
				var _ah = cleanColumnHeaderStr(ah);
				return LevDistance.calc(_ah,input) <= levTolerance;
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
	var _cleanCell = cleanColumnHeaderStr(cellContent);

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
					debugM({ column: column, origCell: cellContent, foundCell: foundInHeader })
					res.push({ column: column, origCell: cellContent, foundCell: foundInHeader });
				}
			} 

			return res;
			
		},[]);

		foundFromHeader.forEach(function(fhm){
			debugM("headersExtractor","matched header from header line:", fhm.foundCell, " original content:",fhm.origCell);
			foundHeadersMapping.push(fhm)
		});

	} else {

		var knownColumns = foundHeadersMapping.map(function(fhm){ return fhm.column; });
		var knownHeaders = foundHeadersMapping.map(function(fhm){ return fhm.foundCell; });
		var remainingHeaders = headers.filter(function(h){ return knownHeaders.indexOf(h) == -1 })

		var foundFromData = inputLine.reduce(function(res,cellContent, column){
			if (knownColumns.indexOf(column) == -1){

				remainingHeaders.some(function(rh){
					if (detectorsMap[rh] && detectorsMap[rh].some(function(dtc){ return dtc == cellContent; })){
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
				debugM("headersExtractor","* matched header from content:", ffd.foundCell, " original content:",ffd.origCell);
				foundHeadersMapping.push(ffd);
			});

			foundHeadersMapping.sort(function(h1,h2){ return h1.column - h2.column; });

		}

	}

	if (foundHeadersMapping.length == 1){
		debugM("headersExtractor","false positive on header row, emptying results");
		foundHeadersMapping.splice(0,1);
		return false;
	} else if (foundHeadersMapping.length > 1 && isLookingForHeaderLine){
		debugM("headersExtractor","positive match for header line!");
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
	debugM("sheetValidator", "found headers #", foundHeadersMapping.length, "num headers", headers.length)
	return (
		(foundHeadersMapping.length == headers.length) ||
		(foundHeadersMapping.length > 5 && foundHeadersMapping.length >= headers.length / 3  ) ||
		(headers.length - foundHeadersMapping.length < Math.ceil(headers.length * 0.3))
	);
}


var parseSingleSheet = function(metaTable, cellReader,sheetName,dim, indexMetaTable){
	var foundMatchingSheet = false;
	debugM("parseSingleSheet",indexMetaTable);
	var headers = metaTable.columnMappingForRow(indexMetaTable).map(function(x){return x});
	debugM("parseSingleSheet", "trying to metch tab by sheet name",sheetName);
	var identifiedSheetIndexFromTabName = sheetSkipDetector([sheetName], indexMetaTable, metaTable);
	if (identifiedSheetIndexFromTabName != indexMetaTable){
		notifyM("parseSingleSheet","identified different sheet by looking into tab name",
			indexMetaTable,"(" + metaTable.getNameForSheetNum(indexMetaTable) + ")", " identified as:", identifiedSheetIndexFromTabName, "("+metaTable.getNameForSheetNum(identifiedSheetIndexFromTabName)+")" );
		return parseSingleSheet(metaTable, cellReader, sheetName, dim, identifiedSheetIndexFromTabName);
	}

	debugM("parseSingleSheet","headers",headers);
	var sheetData = [];
	var foundHeadersMapping = [];

	for(var row = dim.min.row || 1; row <= dim.max.row; row++){
		
		var rowContent = []
		for (var column = dim.min.col || 0; column <= dim.max.col; column++){
			var letter = columnLetterFromNumber(column);
			var cellId = letter + row;
			var cellContent = cellReader(cellId);
			rowContent[column] = cellContent
		}

		debugM("parseSingleSheet","lines",rowContent.join("|"));

		var shouldExtractContent = headersExtractor(rowContent,headers, foundHeadersMapping)

		// Allow looking few lines after the headers line to detect the correct sheet
		if ((indexMetaTable != 0 && indexMetaTable != 1) && (!shouldExtractContent ||  sheetData.length < 4)) {
			var identifiedSheetIndex = sheetSkipDetector(rowContent, indexMetaTable, metaTable);
			if (identifiedSheetIndex != indexMetaTable){
				notifyM("parseSingleSheet","identified different sheet while looking for:",
					indexMetaTable,"(" + metaTable.getNameForSheetNum(indexMetaTable) + ")", " identified as:", identifiedSheetIndex, "("+metaTable.getNameForSheetNum(identifiedSheetIndex)+")" );
				return parseSingleSheet(metaTable, cellReader, sheetName, dim, identifiedSheetIndex);
			}
		}

		if (shouldExtractContent){
			var extractedData = contentExtractor(rowContent,foundHeadersMapping);
			debugM("parseSingleSheet","extracted data",extractedData.join(","))
			sheetData.push(extractedData)
		}
		
	}

	var sheetMatchVerified = sheetValidator(headers,foundHeadersMapping);
	
	if (sheetMatchVerified){
		debugM("parseSingleSheet","verified positive match for sheet!");
		return {"data":sheetData,"finalIndex":indexMetaTable,"headers":foundHeadersMapping.map(function(hm){ return hm.foundCell; })};
	} else {
		debugM("parseSingleSheet","negative match for sheet...");
		return null;
	}
}


var sheetMetaIdentifier = function(cellContent, metaSheetNum, metaTable){

	var nameFromMetaTable = metaTable.instrumentSubTypes[metaSheetNum] || metaTable.instrumentTypes[metaSheetNum];
	
	var cleanCellContent = cleanColumnHeaderStr(cellContent);
	var options = [nameFromMetaTable].concat(knownSheetContentIdentifiers[metaSheetNum] || []);
	return options.some(function(value){ return cleanCellContent == cleanColumnHeaderStr(value) })

}

var sheetSkipDetector = function(inputLine, metaSheetNum, metaTable){
	// for the first two tabs, skip detection
	return inputLine.reduce(function(_metaSheetNum, cellContent){
		if (_metaSheetNum == metaSheetNum) {
			var i = _metaSheetNum + 1;
			for (i = _metaSheetNum; i < metaTable.instrumentTypes.length ; i++){
				if (sheetMetaIdentifier(cellContent, i, metaTable)){
					debugM("sheetSkipDetector","skipping sheet! matched to meta sheet #" + i);
					return i;
				}
			}
			return metaSheetNum;
		} else {
			return _metaSheetNum
		}
	},metaSheetNum);
}


var parseSheets = function(sheets){

	var metaTable = MetaTable.getMetaTable();
	var lastSheetNum = metaTable.getLastSheetNum();
	var debugSheet;
	var parsedSheetsData = []

	var lookForNextSheet = function(res, _sheets){
		if (res.length < lastSheetNum && _sheets.length > 0){
			var sheetTabNum = sheets.length - _sheets.length;
			if (debugSheet != null && debugSheet == sheetTabNum ) {
				global.debug = true;
			}
			console.log("%%%%%% parsing file tab #",sheetTabNum, " looking for meta table #",res.length, "called",metaTable.getNameForSheetNum(res.length));
			var sheet = _sheets.shift();
			var sheetName = sheet.name;
			sheet && sheet.read(function(err, sheetCB,dim){ 
				var sheetOutput = parseSingleSheet(metaTable,sheetCB,sheetName,dim,res.length);

				if (sheetOutput && sheetOutput.finalIndex != res.length){
					while(res.length < sheetOutput.finalIndex){
						debugM("lookForNextSheet","padding output array with empty data to match expected progress of meta table idx")
						res.push([]);
					}
				}

				if (sheetOutput && sheetOutput.data && sheetOutput.data.length > 0){
					debugM("parseSheets","adding sheet lines count #",sheetOutput.data.length);
					res.push(sheetOutput);
				}
				
				if ( debugSheet != null && debugSheet == sheetTabNum ) {
					process.exit();
				}
				lookForNextSheet(res, _sheets);
			}) 
		} else if (res.length == lastSheetNum || _sheets.length == 0) {
			console.log("++++++ parsed & found all sheets");

			res.forEach(function(resSheet, metaIdx){
				if (resSheet.headers && resSheet.data){
					var engMap = resSheet.headers.map(function(cm){ return { "columnName" : metaTable.englishColumns[ metaTable.hebrewColumns.indexOf(cm) ] || cm }  });
					parsedSheetsData.push({engMap : engMap, data: resSheet.data, idx: metaIdx})
				}
			});
			
		}

	}


	lookForNextSheet([], sheets.map(function(x){return x}));

	return parsedSheetsData;
}


