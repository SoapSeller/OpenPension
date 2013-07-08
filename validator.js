var MetaTable = require('./MetaTable')

exports.validate = function(supplier, tabIndex, headers, content) {
// supplier; (string) 'Migdal' לדגמ
// tabIndex; (integer) the tab number in the suppliers xls sheet
// headers; (array of objects) [{columnName: 'instrument_id'}] 
//  
// content; (array of arrays - each of which has the same length as headers) [
// 				["instrument 1"],
// 				["instrument 2"] 
// 			]

	// validate all content arrays have same length as headers
	validStatus = {valid: true}
	headercount = headers.length;

	for (var i = 0; i < content.length; i++){
		line = content[i];
		if (line.length !== headercount){
			validStatus['valid'] = false;
			validStatus['error'] = 'line ' + i + ' has ' + line.length + ' columns. expected ' + headercount + '.';
		}
	}

	removeEmptyLines(content)
	removeSumLines(content)
	validateTypes();


	var db = require('./db').open();
	var tableWriter = db.openTable(headers)
	tableWriter(content);

	console.log("<><><<>< headers", headers)
	console.log("<><><<>< Sheet Data",content);
	console.log("<><><<>< Validation", validStatus);
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

function removeSumLines(content){
	
}

function validateTypes(){
	
}
