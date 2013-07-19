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
	// removeBadLengthLines(content, headers.length);
	// console.log(content);
	// var goodData = removeRowsWithLittleData(content, headers);
	// console.log(goodData);
	// process.exit();

	removeEmptyLines(content)
	// removeSumLines(content)
	validateTypes();

	var DB =  require('./db');

	// var db = new DB.csv(supplier + "_tab_" + tabIndex + ".csv");
	var db = DB.open();
	var tableWriter = db.openTable(headers);
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

var removeRowsWithLittleData = function(data, headers){
	var goodData = data.filter(function(row){
		if (row.filter(function(x){return x != null && x != undefined && x != "" }).length < headers.length / 2)
			return false
		else return true
	});
	return goodData;
}

function removeBadLengthLines(content, numColumns)
{
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
	for (var i = 0; i < line.length; i++){
		if (line[i] != ''){
			return false;
		}
	}
	return true;
}

function removeLinesWithoutInstrumentSymbol(content, headers){
	var instrumentSymbolIndex = getInstrumentSymbolIndex(headers);
	if (instrumentSymbolIndex == -1){
		console.log('missing instrument symbol in headers. ');
	}
	for (var rowIndex = content.length - 1 ; rowIndex > -1; rowIndex--){
		if (content[rowIndex][instrumentSymbolIndex] == ''){
			console.log('@@ removing: ' + content[rowIndex]);
			content.splice(rowIndex, 1);
		}
	}
}

function getInstrumentSymbolIndex(headers){
	var INSTRUMENT_SYMBOL = "instrument_symbol";
	for (var i=0; i < headers.length; i++){
		for (key in headers[i]){
			if (headers[i][key] == INSTRUMENT_SYMBOL){
				return i;
			}
		}
	}
	return -1;
}

function validateTypes(){
	
}
