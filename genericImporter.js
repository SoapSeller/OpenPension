var MetaTable = require('./MetaTable')
var xlsx = require("./xlsxparser.js");

exports.parseXls = function(filename){
	var metaTable = MetaTable.getMetaTable();
	
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


var parseSheets = function(sheets){

	var parseSingleSheet = function(cellReader, dim){
		for(var outer = dim.min.row; outer < dim.max.row; outer++){
			for (var inner = dim.min.col; inner < dim.max.col; inner ++){
				
			}
		}
	}

	sheets.map(function(so){ so.read(function(err, sheetCB,dim){ parseSingleSheet(sheetCB,dim); }) });

	
}


// exports.parseXls("res/migdal.xlsx")