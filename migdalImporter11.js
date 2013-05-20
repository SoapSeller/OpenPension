/*
 * Import data from excel file
 * 
 * 1. find header row
 * 2. translate header
 * 3. get sheet type (bond /row) by header
 * 4. get fields by sheet type
 * 5. iterate rows
 * 5a. read field values from row by configured source
 * 5b. update additional properties 
 * 5c. merge values and additional properties add to result set
 * 6. return result set
 */

var xlsx = require("./xlsxparser.js");

var fieldsByType = {
		stock: ["local", "instrument_sub_type", "instrument_type", "management", "fund", "financial_product_number", "issuer", "symbol", "market", "currency", "market_cap"],
		bond: ["local", "instrument_sub_type", "instrument_type", "management", "fund", "financial_product_number", "issuer", "symbol", "market", "rating", "rating_body", "currency", "interest_rate", "duration", "yield", "market_cap", "amount_of_public_shares"]
}

var NO_CHANGE = "$NC$";

//TODO load from file

//HEADER
var dictionary = {
  "שווי שוק (אלפי ₪)" : "market_cap",
  "סוג מטבע" : "currency",
  "ענף מסחר" : "market",
  "מס. נייר ערך" : "financial_product_number",
  "מנפיק" : "issuer",
  "שיעור מנכסי הקרן (אחוזים)" : "amount_of_public_shares",
  "מזומנים ושווי מזומנים" : "symbol",
  "דירוג" : "rating",
  "שם מדרג" : "rating_body",
  "שיעור הריבית" : "interest_rate",
  "תשואה לפידיון" : "yield",
  "שווי שוק" : "market_cap",
  "שעור מנכסי השקעה" : "rate_of_fund"

};

/*
 * find the header row in sheet,
 * look for a row with significant number of dictionary items
 *
 */
var findHeaderRow = function(dim, getCell, dictionary) {

  var decisionThreshold = 2;
  //number of needed dictionary items

  for (var rowNumber = 1; rowNumber < dim.max.row; rowNumber++) {

    var foundItems = 0;

    for (var columnIndex = 0; columnIndex <= dim.max.col; columnIndex++) {

      var columnString = String.fromCharCode(columnIndex + 65);	//index + 'A'
      var cellValue = getCell(columnString + rowNumber);

      if (dictionary.hasOwnProperty(cellValue)) {
        foundItems++;
      }

      if (foundItems == decisionThreshold) {
        return rowNumber;
      }

    }
  }
  return -1;  //not found
}

/*
 * get sheet type by header
 */
var getSheetType = function(headerObj) {

  var bondFields = ["rating", "rating_body", "interest_rate", "duration", "yield", "amount_of_public_shares"];

  for (var headerField in headerObj) {
    if (bondFields.indexOf(headerField) != -1) {
      return "bond";
    }
  }

  return "stock";

}


function isMissingMandatoryFields(fields) {

  // console.log("JSON.stringify(fields):" + JSON.stringify(fields));

  var missingFields = [];
  var mandatoryFields = Object.keys(allFields).filter(function(field) {
    return true == allFields[field].mandatory;
  });

  // console.log("JSON.stringify(mandatoryFields):" + JSON.stringify(mandatoryFields));

  for (var i in mandatoryFields) {

    // console.log("i:" + i);
    // console.log("mandatoryFields[i]:" + mandatoryFields[i]);
    if (fields.indexOf(mandatoryFields[i]) == -1) {
      missingFields.push(mandatoryFields[i]);
    }
  }

  if (missingFields.length > 0) {
    console.err("missing:" + JSON.stringify(missingFields));
    return true;
  }
  // console.log("not missing");
  return false;

}

//translte header and get default values
var normalizeHeader = function(headerRow, dim, getCell) {

  var normalizedHeader = {};

  for (var columnIndex = 0; columnIndex <= dim.maxIdx.col; columnIndex++) {

    var columnString = String.fromCharCode(columnIndex + 65);
    //index + 'A'

    // console.log("columnString:"+columnString);
    var headerCellData = getCell(columnString + headerRow);

    // console.log("headerCellData:"+headerCellData);

    //get translated name for header column
    translatedColumnName = dictionary[getCell(columnString + headerRow)];

    if (translatedColumnName == undefined || translatedColumnName == "") {
      continue;
    }

    normalizedHeader[translatedColumnName] = columnString;

  }

  // console.log("norm:" + JSON.stringify(normalizedHeader));
  if (isMissingMandatoryFields(Object.keys(normalizedHeader))) {
    return [];
  }
  else {
    return normalizedHeader;
  }
}

/*
 * --cell     - get value from constant cellId (e.g "D6")
 * --column   - get value from other column in current row (e.g "F")
 * --field    - get value from other field in current row (e.g "currency")
 * --constant - field value is consant
 * --empty 		- field value is empty
 */
var sources = {
  cell : function(getCell, row, cellId, header) {
    return getCell(cellId);
  },
  column : function(getCell, row, column, header) {
    return getCell(column + row);
  },
  field : function(getCell, row, field, header) {
    return getValue(field, getCell, row, header);
  },
  constant : function(getCell, row, constant, header) {
    return constant;
  },
  empty : function(getCell, row, constant, header) {
    return "";
  }
};

var allFields = {
  // "type": validators.type,
  "management" : {
    source : sources.field,
    value : "symbol"
  },
  "fund" : {
    source : sources.cell,
    value : "B2"
  },
  "financial_product_number" : {
    source : sources.field
  },
  "issuer" : {
    source : sources.field,
    value : "symbol"
  },
  "symbol" : {
    source : sources.field
  },
  "market" : {
    source : sources.field
  },
  "rating" : {
    source : sources.field,
    mandatory : true
  },
  "rating_body" : {
    source : sources.field
  },
  "currency" : {
    source : sources.field
  },
  "interest_rate" : {
    source : sources.field
  },
  "duration" : {
    source : sources.field
  },
  "yield" : {
    source : sources.field
  },
  "market_cap" : {
    source : sources.field
  },
  "amount_of_public_shares" : {
    source : sources.field
  },
  "local" : {
    source : sources.column,
    property : true,
    value : "B",
    manipulator : function(value) {
      // console.log("manipulator value:" + value);
      if (/^בישראל.*$/.test(value)) {
        return true;
      }
      else if (/^בחו\"ל.*$/.test(value)) {
        return false;
      }
      
      return NO_CHANGE;
    }
  },
  "instrument_sub_type" : {
    source : sources.column,
    property : true,
    value : "C"
  },
  "instrument_type" : {
    source : sources.cell,
    value : "B7"
  }
};

/*
 * get value of cell in sheet,
 * call configured source function
 */
function getValue(field, getCell, row, header) {
  // console.log("getValue header:"+ JSON.stringify(header));
  // console.log("getValue getCell1:"+ getCell);
  // console.log("getValue field:" + field);
  
  var result;

  if (allFields[field].source == undefined || //default, get cell from current field by header
  (allFields[field].source == sources.field && allFields[field].value == undefined)) {

    // console.log("getValue header[field]:"+ header[field]);
    if (header[field] == undefined) {//field is not in original header
      result = "";
    }
    else {
      result = sources.column.call(this, getCell, row, header[field], header);
    }
  }
  else {//get cell value by source as configured
  	
  	var value = allFields[field].value;
  	
		if (Array.isArray(value)){ //value is array, return result in array
  		result = [];
 
  		for(var i in value){
  			result.push(allFields[field].source.call(this, getCell, row, allFields[field].value[i], header));
  		}	
  	}
  	else{//value is not an array, single value
  	  result = allFields[field].source.call(this, getCell, row, allFields[field].value, header);
  	}
  }

	//call manipulator
  if (allFields[field].manipulator != undefined) { 
    result = allFields[field].manipulator.call(this, result);
  }

  return result;
}

function getFields(type) {
  // return
}

/*
 * return true if row is a property row
 * false otherwise
 */
function isPropertyRowByFieldCount(rowData) {

  var nonEmptyColumns = 0;
  var threshold = 9;

  for (var field in rowData) {
    if (rowData[field] != undefined && rowData[field] != "") {
      nonEmptyColumns++;
    }
  }

  var result = (nonEmptyColumns < threshold);
  return result;

}

function isPropertyRowByMandatoryFields(rowData) {

  // console.log("JSON.stringify(fields):" + JSON.stringify(rowData));

  var missingFields = [];
  var mandatoryFields = Object.keys(allFields).filter(function(field) {
    return true === allFields[field].mandatory;
  });

  // console.log("JSON.stringify(mandatoryFields):" + JSON.stringify(mandatoryFields));

  for (var i in mandatoryFields) {
    if (rowData.indexOf(mandatoryFields[i]) == -1) {
      missingFields.push(mandatoryFields[i]);
    }
  }

  if (missingFields.length > 0) {
    // console.log("missing:" + JSON.stringify(missingFields));
    return true;
  }
  
  // console.log("not missing");
  return false;

}

exports.convert = function(err, getCell, dim) {

  if (err) {
    console.log(err);
    return;
  }

  var headerRow = findHeaderRow(dim, getCell, dictionary);
  // console.log("headerRow:"+headerRow);

  var normalizedHeader = normalizeHeader(headerRow, dim, getCell);
  // console.log("normalizedHeader: "+ JSON.stringify(normalizedHeader));

  var sheetType = getSheetType(normalizedHeader);
  // console.log("sheetType:"+sheetType);

  var dataLineNumber = headerRow + 1;

  if (normalizedHeader.length == 0)//no header, or header is missing mandatory fields
    return;

  var result = new Array();
  var additionalProperties = {};
  var fields = fieldsByType[sheetType];

  //fields available in row
  var standardFields = fields.filter(function(field) {
    return (allFields[field].property == undefined || allFields[field].property == false)
  });
  
  //additional property fields
  var propertyFields = fields.filter(function(field) {
    return (allFields[field].property != undefined && allFields[field].property == true)
  });

  for (var rowNumber = dataLineNumber; rowNumber < dim.max.row; rowNumber++) {

    var rowData = {};
    var propertyRow = false;

    for (var i in standardFields) {

  var field = standardFields[i];
      rowData[field] = getValue(field, getCell, rowNumber, normalizedHeader);//read value of column

    }
    
		//if property row, get values of property fields 
		// and put in additionalProperties
    if (propertyRow = isPropertyRowByFieldCount(rowData)) { 

      for (var i in propertyFields) {

        var field = propertyFields[i];
        var value = getValue(field, getCell, rowNumber, normalizedHeader);

        if (value != NO_CHANGE) {
          additionalProperties[field] = value;
        }

      }
      continue; //read next row
    }
    else {
      mergeInto(rowData, additionalProperties);      //add additional properties to row data
      result.push(rowData);

    }
  }

  return {
  	rows: result,
  	type: sheetType
  }
};

/*
 * merge objects o1 and o2 into o1
 */
function mergeInto(o1, o2) {
  if (o1 == null || o2 == null)
    return o1;

  for (var key in o2)
  if (o2.hasOwnProperty(key))
    o1[key] = o2[key];

  return o1;
}
