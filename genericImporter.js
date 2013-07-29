var MetaTable = require('./common/MetaTable')
var xlsx = require("./xlsxparser");
var LevDistance = require('./LevDistance')

var managingBody = null;
var year = null;
var quarter = null;
var indexMetaTable = 0;
var indexFileTab = 0;

exports.parseXls = function(filename,givenManagingBody,givenYear, givenQuarter){
	managingBody = givenManagingBody;
	year = givenYear;
	quarter = givenQuarter;
	xlsx.getSheets(filename, parseSheets);
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
var debug = false;
var strictMode = false;
var levTolerance = 2;
var aliasMap = {
	"סוג מטבע" : ["מטבע"],
	"שם נייר ערך" : [ "מזומנים ושווי מזומנים","שם ני''ע", "סוג נכס" ],
	"שיעור מנכסי ההשקעה" : [ "שיעור מנכסי הקרן", "שיעור מהנכסים" ],
	"מספר נייר ערך" : [ "מספר ני\"ע", "מס' נייר ערך"],
	"שיעור מהערך הנקוב המונפק" : [ "שיעור מהע.נ המונפק", "שיעור מהע.נ המונפק" ],
	"שווי הוגן" : [ "שווי שוק", "שווי השקעה", "שווי הוגן באלפי ש\"ח" ],
	"שווי שוק" : [ "שווי הוגן" ],
	"תשואה לפדיון" : [ "ת. לפדיון" ],
	"שיעור ריבית": ["תנאי ושיעור ריבית","שיעור ריבית ממוצע"],
	"שיעור מהערך הנקוב המונפק" : [ "שעור מערך נקוב מונפק" ]
}

var detectorsMap = {
	"שם נייר ערך" : [ "ב. ניירות ערך סחירים","בישראל","סעיף 1. נכסים המוצגים לפי שווי הוגן:" ]
}

/* DATA MANIPULATION */

var cleanDataStr = function(inputStr){
	return inputStr;
}

var cleanColumnHeaderStr = function(inputStr){
	if (inputStr)
		return inputStr.replace(/\(.*\)/g,"").replace(/["'\n\r]/g,"").replace(/[ ]+/g," ").trim()
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

findFromHeadersLev = function(input, headers){
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



var findInHeaders = function(headers, cellContent, aliasMap){
	var _cleanCell = cleanColumnHeaderStr(cellContent);

	
	
	
	// var debugSheet = 5
	// var debugFileIndex = null
	// if (indexMetaTable == debugSheet -1){
	// 	console.log(cellContent, _cleanCell);
	// }
	// if (indexMetaTable == debugSheet || ( debugFileIndex && indexFileTab == debugFileIndex) ){
	// 	process.exit();
	// }

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


var parseSheets = function(sheets){

	var metaTable = MetaTable.getMetaTable();
	
	var parseSingleSheet = function(cellReader, dim){

		var foundMatchingSheet = false;
		var headers = metaTable.columnMappingForRow(indexMetaTable).map(function(x){return x});

		if (debug) console.log("headers >> ",metaTable.columnMappingForRow(indexMetaTable));
		var foundColumnMapping = [];
		var sheetData = [[]];
		var remainingHeaders = [];

		// for(var row = 1 || 1; row < 15; row++){
		for(var row = dim.min.row || 1; row <= dim.max.row; row++){
			
			if (!foundMatchingSheet){
				if (headers.length == 0 || headers.length < metaTable.columnMappingForRow(indexMetaTable).length / 2){

					var called = metaTable.instrumentTypes[indexMetaTable] + " " + metaTable.instrumentSubTypes[indexMetaTable];

					console.log("** found matching meta table index ", indexMetaTable, " file tab index:",indexFileTab," called",called)
					foundMatchingSheet = true;
					indexMetaTable++;
				}
			}
			if (headers.length > 0 && headers.length < metaTable.columnMappingForRow(indexMetaTable).length) {
				if (headers.length > 5 || headers.length <= metaTable.columnMappingForRow(indexMetaTable).length / 2){
					if (strictMode) {
						console.log("found only partial match of headers, exiting..");
						console.log("found mapping",foundColumnMapping);
						console.log("remaining headers", headers);
						process.exit();
					} else {	
						console.log("found only partial match of headers, not in strict mode.. continue");
						console.log("found mapping",foundColumnMapping);
						console.log("remaining headers", headers);
						remainingHeaders = headers;
						headers = [];
					}
				} else {
					headers = metaTable.columnMappingForRow(indexMetaTable);
					foundColumnMapping = [];
				}
			} else if (headers.length == 0) {
				// headers have been found, were parsing content, add new line to output data
				sheetData.push([]);
			}

			for (var column = dim.min.col || 0; column <= dim.max.col; column++){
				var letter = columnLetterFromNumber(column);
				var cellId = letter + row;
				var cellContent = cellReader(cellId);
				
				if (headers.length != 0) { 
					//###>> enter the following while we have not found the headers yet!
					// TODO: check this works with value 0 in cell
					if (cellContent) {	
						
						if (debug) console.log("cell content>> ",cellContent);

						var foundInHeader = findInHeaders(headers, cellContent, aliasMap);
						if (foundInHeader) {
							console.log("* found matching header, removing it..", foundInHeader, " original content:",cellContent);
							headers.splice( headers.indexOf(foundInHeader), 1 );
							foundColumnMapping.push({ row: row, column: column, origCell: cellContent, foundCell: foundInHeader });
						}
					}


				} else {
					//###>> Enter here to collect actual data
					if (foundColumnMapping.some(function(x){ return x.column == column })) {
						sheetData[sheetData.length -1].push(cellContent)
					} else if (remainingHeaders.length > 0){ // do detection of missing headers by content, due to random data BS
						remainingHeaders.some(function(rh){
							if (detectorsMap[rh] && detectorsMap[rh].some(function(dtc){
								if (dtc == cellContent) {
									if (debug) console.log("* detected new column by content! ", rh," ", cellContent)

									var placeAfter = null;

									if (!foundColumnMapping.some(function(fcm){ 
										if (fcm.column > column){
											placeAfter = foundColumnMapping.indexOf(fcm);
											return true;
										} else {
											return false;
										}
									})) {
										placeAfter = foundColumnMapping.length;
									}
									foundColumnMapping.splice(placeAfter,0, 
										{ row: row, column: column, origCell: "", foundCell: rh })
									remainingHeaders.splice( remainingHeaders.indexOf(rh), remainingHeaders.indexOf(rh) +1 );
									sheetData[sheetData.length -1].push(cellContent)
									return true;
								} else {
									return false;
								}
							})){
								return true;
							} else {
								return false;
							};
						});
					}
				}
			}
		}



		console.log("finished parsing sheet, match count:",indexMetaTable -1, "sheet count:",indexFileTab, " remaining headers:", remainingHeaders);
		var engMap = foundColumnMapping.map(function(cm){ return { "columnName" : metaTable.englishColumns[ metaTable.hebrewColumns.indexOf(cm.foundCell) ] }  });
		console.log("output headers:",foundColumnMapping.map(function(x){return x.foundCell}).join(" | "));
		console.log("output headers en:",engMap.map(function(x){return x.columnName}).join(" | "));
		console.log("output data sample:",sheetData.slice(0,2).map(function(x){return x.join(" | ")}));
		console.log("==");
		if (indexMetaTable == 2) {
			// console.log("###########");
			// console.log(headers, engMap);
			// console.log("###########");
			// process.exit();
		}
		var validator = require('./validator').validate(engMap,sheetData,managingBody,indexMetaTable -1,year,quarter);
	}


	// sheets[3].read(function(err, sheetCB,dim){ parseSingleSheet(sheetCB,dim); })

	sheets.some(function(so){
		if (indexMetaTable < 35){
			if (indexMetaTable < metaTable.getLastSheetNum()){
				console.log("%%%%%% parsing file tab index:",indexFileTab, " looking for meta table tab:",indexMetaTable +1);
				so.read(function(err, sheetCB,dim){ parseSingleSheet(sheetCB,dim); }) 
			} else {
				return true;
			}
			indexFileTab++; 
			return false;
		} else {
			return true;
		}
		
		
	});

	
}


// exports.parseXls("res/migdal.xlsx")
