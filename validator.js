exports.validate = function(supplier, tabIndex, headers, content) {
// supplier; (string) 'Migdal' לדגמ
// tabIndex; (integer) the tab number in the suppliers xls sheet
// headers; (array of objects) [{columnName: 'instrument id'}] 
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

	// for each content array,
	// 	validate all values are not null, not empty strings, (not 0?)
	// 	for each column
	// 		validate the column data type matches its value


	var db = require('./db').open();
	var tableWriter = db.openTable(headers)
	tableWriter(content);

	console.log("<><><<>< Sheet Data",content);
	console.log("<><><<>< Validation", validStatus);

}

