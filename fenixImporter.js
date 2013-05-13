var xlsx = require("./xlsxparser");

var fileName ="./res/fenix.xlsx";
var sheetName="נ\"ע סחירים_ אג\"ח קונצרני";


var removeLineBreaks = function (s) {
  s = s.replace(/(\r\n|\n|\r)/gm," ");
  return s;
}


function toHex(str) {
    var hex = '';
    for(var i=0;i<str.length;i++) {
        hex += ''+str.charCodeAt(i).toString(16);
    }
    return hex;
}
 
//TODO load from file
var dictionary = {
 	"שם ני''ע" : "instrument_symbol",
 	"מספר ני''ע" : "instrument_id",
 	"ענף מסחר" : "market",
 	"דרוג" : "rating",
 	"שם מדרג" : "rating_agency",
 	"מח''מ     (שנים)": "time_to_maturity",
 	"מטבע" : "currency",
 	"שיעור ריבית     (אחוזים)" : "interest_rate",
 	"תשואה לפדיון    (אחוזים)" : "yield",
 	"שווי שוק    (אלפי ש''ח)" : "market_cap",
 	"שעור מערך נקוב מונפק    (אחוזים)":  "rate_of_IPO",
 	"שעור מנכסי ההשקעה    (אחוזים)" : "rate_of_fund"

};

var mandatoryFields = ["currency"];

//TODO load from file
var defaultColumn = {
	// "B" : "description"
};


//get default value for column by column id char 
var getDefaultColumnName = function(columnId) {

	if (defaultColumn.hasOwnProperty(columnId)) {
		return defaultColumn[columnId];
	}
}

//get translated column name by column id
var translateColumnName = function(columnName) {
	columnName = removeLineBreaks(columnName);
	if (dictionary.hasOwnProperty(columnName)) {
		return dictionary[columnName];
	} else {
		var result = Object.keys(dictionary).filter(
		function(k){
		return k.indexOf(columnName) != -1;
		})[0];

		return result || "";
	}
}

var normalizeHeader = function(columnIndex, dim, getCell) {

	var normalizedHeader = {};
	var headerLineNumber = 6; //TODO: find programatically
	
	for (var columnIndex = 0; columnIndex <= dim.maxIdx.col; columnIndex++) {

		//index + 'A'
		var columnString = String.fromCharCode(columnIndex + 65);

		var headerCellData = getCell(columnString + headerLineNumber);
		if (headerCellData == "") {
			translatedColumnName = getDefaultColumnName(columnString);
		} else {
			//read header name for column and normalize it
			translatedColumnName = translateColumnName(getCell(columnString + headerLineNumber));
		}

		if (translatedColumnName == undefined || translatedColumnName == "") {
			continue;
		}

		//read value of column
		normalizedHeader[columnString] = translatedColumnName;

	}

	return normalizedHeader;
}



console.log('Reading sheet name:' + sheetName);

xlsx.openSheet(fileName, sheetName, function(err, getCell, dim) {

	if (err) {
		console.log(err);
		return;
	}

	//example:
	var dataLineNumber = 7;//TODO: find programatically

	var normalizedHeader = normalizeHeader(columnIndex, dim, getCell);
	

	// console.log((removeLineBreaks(w)));
	// console.log((removeLineBreaks("מח''מ  \n  (שנים)")));
	// console.log(JSON.stringify(dim));
	// return;
	// console.log(w);
	// console.log("מח''מ  \n  (שנים)");
	


	var result = new Array();

	for (var lineNumber = dataLineNumber; lineNumber < dim.max.row; lineNumber++) {

		var line = {};
		var skipLine;

		for (var columnIndex = 0; columnIndex <= dim.max.col; columnIndex++) {

			skipLine = false;

			//index + 'A'
			columnString = String.fromCharCode(columnIndex + 65);

			var translatedColumnName = normalizedHeader[columnString];

			//ignore fields not having translated or default column name
			if (translatedColumnName == undefined || translatedColumnName == "") {
				continue;
			}

			//read value of column
			line[translatedColumnName] = getCell(columnString + lineNumber);

			//skip lines missing mandatory fields
			if (mandatoryFields.indexOf(translatedColumnName) != -1 && line[translatedColumnName] == "") {
				skipLine = true;
				break;
			}

		}

		if (!skipLine) {
			result.push(line);
		}
	}
	console.log("===========================================================================");
	console.log(JSON.stringify(result, null, "\t"));

});