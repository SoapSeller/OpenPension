var xlsx = require("./xlsxparser.js");

var fileName = "./res/migdal.xlsx"
var sheetName = "16";

//TODO load from file
var dictionary = {
	/*: "management"
	 : "fund",
	 : "financial_product_number",
	 : "symbol",
	 : "rating",
	 : "rating_body",
	 : "interest_rate",
	 : "duration",
	 : "yield",*/
	"שווי שוק (אלפי ₪)" : "market_cap",
	"סוג מטבע" : "currency",
	"ענף מסחר" : "market",
	"מס. נייר ערך" : "financial_product_number",
	"מנפיק" : "issuer",
	"שיעור מנכסי הקרן (אחוזים)" : "amount_of_public_shares"
};

var mandatoryFields = ["currency"];

//TODO load from file
var defaultColumn = {
	"B" : "description"
};


//get default value for column by column id char 
var getDefaultColumnName = function(columnId) {

	if (defaultColumn.hasOwnProperty(columnId)) {
		return defaultColumn[columnId];
	}
}

//get translated column name by column id
var translateColumnName = function(columnName) {
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
	var headerLineNumber = 12; //TODO: find programatically
	
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
	var dataLineNumber = 17;

	var normalizedHeader = normalizeHeader(columnIndex, dim, getCell);
	// console.log(JSON.stringify(normalizedHeader));
	
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
