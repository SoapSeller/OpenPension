var MetaTable = require('./MetaTable')
var xlsx = require("./xlsxparser");
var LevDistance = require('./LevDistance')

var provider = null;
var sheetCounter = 0;

exports.parseXls = function(filename,givenProvider){
	provider = givenProvider;
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
var levTolerance = 3;
var aliasMap = {
	"שם נייר ערך" : [ "מזומנים ושווי מזומנים","שם ני''ע" ],
	"שיעור מנכסי ההשקעה" : [ "שיעור מנכסי הקרן" ],
	"מספר נייר ערך" : [ "מספר ני\"ע" ],
	"שיעור מהערך הנקוב המונפק" : [ "שיעור מהע.נ המונפק" ]
}

var detectorsMap = {
	"שם נייר ערך" : [ "ב. ניירות ערך סחירים" ]
}

/* DATA MANIPULATION */

var cleanDataStr = function(inputStr){
	return inputStr;
}

var cleanColumnHeaderStr = function(inputStr){
	if (inputStr)
		return inputStr.replace(/\(.*\)/g,"").replace(/["']/g,"").trim()
	else 
		return ""
}


var findInHeaders = function(headers, cellContent){
	var _cleanCell = cleanColumnHeaderStr(cellContent);

	if (headers.indexOf(_cleanCell) > -1) {
		return _cleanCell;
	} else {
		var _res = null;
		headers.some(function(h){
			var _h = cleanColumnHeaderStr(h);
			if (LevDistance.calc(_h,_cleanCell) < levTolerance) {
				_res = h;
				return true;
			} else if (aliasMap[h]) {
				return aliasMap[h].some(function(ah){
					var _ah = cleanColumnHeaderStr(ah)
					if (_ah == _cleanCell || LevDistance.calc(_ah,_cleanCell) < levTolerance){
						_res = h;
						return true;
					} else {
						return false;
					}
				})
			} else {
				return false;
			}
		})
		return _res;
	}
};


var parseSheets = function(sheets){

	var metaTable = MetaTable.getMetaTable();
	

	var parseSingleSheet = function(cellReader, dim){

		var foundMatchingSheet = false;
		var headers = metaTable.columnMappingForRow(sheetCounter);
		if (debug) console.log("headers >> ",metaTable.columnMappingForRow(sheetCounter));
		var foundColumnMapping = [];
		var sheetData = [[]];
		var remainingHeaders = [];

		// for(var row = 1 || 1; row < 15; row++){
		for(var row = dim.min.row || 1; row < dim.max.row; row++){

			if (!foundMatchingSheet){
				if (headers.length < metaTable.columnMappingForRow(sheetCounter).length / 2){
					foundMatchingSheet = true;
					sheetCounter++;
				}
			}

			if (headers.length > 0 && headers.length < metaTable.columnMappingForRow(sheetCounter).length) {
				if (headers.length < metaTable.columnMappingForRow(sheetCounter).length / 2){
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
					header = metaTable.columnMappingForRow(sheetCounter);
					foundColumnMapping = [];
				}
			} else if (headers.length == 0) {
				// headers have been found, were parsing content, add new line to output data
				sheetData.push([]);
			}

			for (var column = dim.min.col || 0; column < dim.max.col; column++){
				var letter = columnLetterFromNumber(column);
				var cellId = letter + row;
				var cellContent = cellReader(cellId);
				
				if (headers.length != 0) { 
					//###>> enter the following while we have not found the headers yet!
					// TODO: check this works with value 0 in cell
					if (cellContent) {	
						
						if (debug) console.log("cell content>> ",cellContent);

						var foundInHeader = findInHeaders(headers, cellContent);
						if (foundInHeader) {
							headers.splice( headers.indexOf(foundInHeader), headers.indexOf(foundInHeader) +1 )
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
									console.log("detected new column by content! ", rh," ", cellContent)

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

									sheetData[placeAfter].push(cellContent)
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
		// console.log("headerToColumn >> ",foundColumnMapping);
		// console.log("sheetData >> ",sheetData);

		var engMap = foundColumnMapping.map(function(cm){ return { "columnName" : metaTable.englishColumns[ metaTable.hebrewColumns.indexOf(cm.foundCell) ] } })
		
		var validator = require('./validator').validate(provider, sheetCounter, engMap, sheetData);
		// console.log(provider, sheetCounter, engMap, sheetData);
		if (sheetCounter == 5) process.exit();
		
		// console.log("<><><<><",engMap);
		// var db = require('./db').open();
		// var tableWriter = db.openTable(engMap)
		// tableWriter(sheetData);
		
	}


	// sheets[3].read(function(err, sheetCB,dim){ parseSingleSheet(sheetCB,dim); })
	sheets.map(function(so){ 
		so.read(function(err, sheetCB,dim){ parseSingleSheet(sheetCB,dim); }) 
	});

	
}


// exports.parseXls("res/migdal.xlsx")