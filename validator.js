var MetaTable = require('./MetaTable')

exports.validate = function(supplier, tabIndex, headers, content,tabIndex) {
// supplier; (string) 'Migdal' לדגמ
// tabIndex; (integer) the tab number in the suppliers xls sheet
// headers; (array of objects) [{columnName: 'instrument_id'}] 
//  
// content; (array of arrays - each of which has the same length as headers) [
// 				["instrument 1"],
// 				["instrument 2"] 
// 			]

	// validate all content arrays have same length as headers
	removeBadLengthLines(content, headers.length);
	removeEmptyLines(content);
	removeLinesWithoutInstrumentSymbol(content, headers);
	removeSpecialChars(content);
	
	// validateTypes();

	var DB =  require('./db');
	var db = new DB.csv(supplier + "_tab_" + tabIndex + ".csv");
	var tableWriter = db.openTable(headers)
	tableWriter(content);

	// console.log("<><><<>< headers", headers)
	// console.log("<><><<>< Sheet Data",content);
}

function removeSpecialChars(content, numColumns){
	for (var rowIndex = content.length - 1 ; rowIndex > -1; rowIndex--){
		var numColumns = content[rowIndex].length;
		for (var columnIndex = numColumns -1; columnIndex > -1; columnIndex--){
			var cellContent = content[rowIndex][columnIndex];
			content[rowIndex][columnIndex] = getCleanValue(cellContent);
		}
	}
}

function getCleanValue(value){
	// remove %$
	return value.replace("$", "").replace("%", "");
}

function removeBadLengthLines(content, numColumns){
	for (var i = content.length - 1 ; i > -1; i--){
		if (content[i].length !== numColumns){
			content.splice(i, 1);
			// console.log ('line ' + i + ' has ' + content[i].length + ' columns. expected ' + numColumns + '.');
		}
	}
}

function removeEmptyLines(content){
	for (var i = content.length - 1 ; i > -1; i--){
		if (lineIsEmpty(content[i])){
			content.splice(i, 1);
		}
	}
}

function lineIsEmpty(line)
{
	for (var i = 0; i < line.length; i++)
	{
		if (line[i] != '')
		{
			return false;
		}
	}
	return true;
}

function removeLinesWithoutInstrumentSymbol(content, headers){
	var instrumentSymbolIndex = getInstrumentSymbolIndex(headers);
	for (var rowIndex = content.length - 1 ; rowIndex > -1; rowIndex--){
		if (content[rowIndex][instrumentSymbolIndex] == '')
		{
			console.log('@@ removing: ' + content[rowIndex]);
			content.splice(rowIndex, 1);
		}
	}
}

function getInstrumentSymbolIndex(headers){
	var INSTRUMENT_SYMBOL = "instrument_symbol";
	return 0;
}

function validateTypes(){
	
}
