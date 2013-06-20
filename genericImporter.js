var MetaTable = require('./MetaTable')
var xlsx = require("./xlsxparser");
var LevDistance = require('./LevDistance')

exports.parseXls = function(filename){
	xlsx.getSheets(filename, parseSheets);
}

var curTableData = null;

var advanceTableDataSheet = function(){
	curTableData.sheet++;
}

var parsingState = {
	sheet : 0
}

var aliasMap = {
	"שיעור מנכסי ההשקעה" : [ "שיעור מנכסי הקרן" ],
	"מספר נייר ערך" : [ "מספר ני\"ע" ]
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

var cleanColumnHeaderStr = function(inputStr){
	if (inputStr)
		return inputStr.replace(/\(.*\)/g,"").trim()
	else 
		return ""
}

var debug = true;

var cleanDataStr = function(inputStr){
	return inputStr;
}

var findInHeaders = function(headers, cleanCell){

	var levTolerance = 3;

	if (headers.indexOf(cleanCell) >= 0) {
		return cleanCell;
	} else {
		var _res = null;
		headers.some(function(h){
			
			if (LevDistance.calc(h,cleanCell) < levTolerance) {
				_res = h;
				return true;
			} else if (aliasMap[h]) {
				return aliasMap[h].some(function(ah){
					
					if (ah == cleanCell || LevDistance.calc(ah,cleanCell) < levTolerance){
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


// TODO: print out found matches 
var parseSheets = function(sheets){

	var metaTable = MetaTable.getMetaTable();
	var sheetCounter = 1;

	var parseSingleSheet = function(cellReader, dim){

		var headers = metaTable.columnMappingForRow(sheetCounter);
		if (debug) console.log("headers >> ",headers)

		var foundColumnMapping = [];
		var sheetData = [];

		// for(var row = 5 || 1; row < 20; row++){
		for(var row = dim.min.row || 1; row < dim.max.row; row++){
			if (headers.length < metaTable.columnMappingForRow(sheetCounter) && headers.length != 0){
				console.log("found partial mapping of headers, moving to next sheet");
				process.exit();
			} else if (headers.length == 0) { // headers have been found, were parsing content
				sheetData.push([])
			}
			for (var column = dim.min.col || 1; column < dim.max.col; column ++){
				var letter = columnLetterFromNumber(column);
				var cellId = letter + row;
				var cellContent = cellReader(cellId);

				if (!cellContent) continue;
				// LevDistance.calc("שיעור הריבית","שיעור ריבית")
				if (headers.length > 0) { //###>> enter the following while we have not found the headers yet!

					var cleanHeaderCell = cleanColumnHeaderStr(cellContent);
					if (debug) console.log("clean cell >> ",cleanHeaderCell);

					var foundInHeader = findInHeaders(headers, cleanHeaderCell);
					if (foundInHeader) {
						headers.splice( headers.indexOf(foundInHeader), headers.indexOf(foundInHeader) +1 )
						foundColumnMapping.push({ row: row, column: column, origCell: cleanHeaderCell, foundCell: foundInHeader });
					}

				} else { 
					//###>> Enter here to collect actual data
					if (foundColumnMapping.some(function(x){ return x.column == column })) {
						sheetData[sheetData.length -1].push(cellContent)
					}
				}
			}
		}
		if (debug) console.log("headerToColumn >> ",foundColumnMapping);
		if (debug) console.log("sheetData >> ",sheetData);
		
	}


	sheets[2].read(function(err, sheetCB,dim){ parseSingleSheet(sheetCB,dim); })

	// sheets.map(function(so){ so.read(function(err, sheetCB,dim){ parseSingleSheet(sheetCB,dim); }) });

	
}

/* 
@param String[String[]] sheetRows - two dimentional array of rows and columns 
@param String[] columNames
*/
var findHeaderRow = function(sheetRows,columNames){

	sheetRows.forEach(function(row){
		var rowMatcher = []
		row.slice(0,3).forEach(function(columnCell){
			
			var cleanCell = cleanColumnHeaderStr(columnCell)
			console.log(cleanCell)
			if (columNames.indexOf(cleanCell) >= 0){
				console.log("YAY");
				process.exit();
			}
			
			// console.log(columNames)
			// console.log(columnCell,">>>>", cleanCell);
		})
	})

	
}


// exports.parseXls("res/migdal.xlsx")