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
	"שיעור מנכסי ההשקעה" : [ "שיעור מנכסי הקרן" ]
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

var cleanDataStr = function(inputStr){
	return inputStr;
}
// TODO: print out found matches 
var parseSheets = function(sheets){
	var metaTable = MetaTable.getMetaTable();
	var sheetCounter = 0;

	var parseSingleSheet = function(cellReader, dim){

		var sheetRows = [];
		var headers = metaTable.columnMappingForRow(sheetCounter);
		console.log(headers)
		var headersToColumn = [];

		for(var row = dim.min.row || 1; row < dim.max.row; row++){
			for (var column = dim.min.col || 1; column < dim.max.col; column ++){
				var letter = columnLetterFromNumber(column);
				var cellId = letter + row;
				if (!sheetRows[row]) sheetRows[row] = [];
				sheetRows[row][column] = cellReader(cellId);
				var cleanHeaderCell = cleanColumnHeaderStr(sheetRows[row][column])
				if (headers.indexOf(cleanHeaderCell) >= 0){
					var foundIndex = headers.indexOf(cleanHeaderCell);
					headers = headers.slice( , )
 					headersToColumn[cleanHeaderCell] = column;
				}
			}
		}
		console.log(headersToColumn);

		// var headerRow = findHeaderRow(sheetRows,);

		// sheetRows.forEach(function(row){
		// 	row.forEach(function(column){
		// 		console.log(column,">>>>", cleanDataStr(column));
		// 	})
		// })
		
	}


	sheets[1].read(function(err, sheetCB,dim){ parseSingleSheet(sheetCB,dim); })

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