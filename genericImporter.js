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

var parseSheets = function(sheets){
	var metaTable = MetaTable.getMetaTable();

	var parseSingleSheet = function(cellReader, dim){

		var sheetRows = [];

		for(var row = dim.min.row || 1; row < dim.max.row; row++){
			for (var column = dim.min.col || 1; column < dim.max.col; column ++){
				var letter = columnLetterFromNumber(column);
				var cellId = letter + row;
				if (!sheetRows[row]) sheetRows[row] = [];
				sheetRows[row][column] = cellReader(cellId);
			}
		}

		var headerRow = findHeaderRow(sheetRows,metaTable);

		// sheetRows.forEach(function(row){
		// 	row.forEach(function(column){
		// 		console.log(column,">>>>", cleanDataStr(column));
		// 	})
		// })
		
	}


	sheets[2].read(function(err, sheetCB,dim){ parseSingleSheet(sheetCB,dim); })

	// sheets.map(function(so){ so.read(function(err, sheetCB,dim){ parseSingleSheet(sheetCB,dim); }) });

	
}

/* 
@param String[String[]] sheetRows - two dimentional array of rows and columns 
@param MetaTable metaTable
*/
var findHeaderRow = function(sheetRows,metaTable){

	sheetRows.forEach(function(row){
		var rowMatcher = []
		row.forEach(function(columnCell){
			var cleanCell = cleanColumnHeaderStr(columnCell)
			console.log(columnCell,">>>>", cleanCell);
		})
	})

	
}


// exports.parseXls("res/migdal.xlsx")