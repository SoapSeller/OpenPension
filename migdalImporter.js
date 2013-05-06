// var fs = require('fs'),
//     parseString = require('xml2js').parseString;

// var filename = "xl/worksheets/sheet6.xml";

// fs.readFile(filename, "utf8", function(err, data) {


var xlsx = require("./xlsxparser.js");


  //TODO: find programmatically
  var headerLine = 12;


  //TODO load from file
  var dictionary = {
    /*: "management"
    : "fund",
    : "financial_product_number",
    : "symbol",
    : "market",
    : "rating",
    : "rating_body",
    : "currency",
    : "interest_rate",
    : "duration",
    : "yield",
    : "market_cap",*/

    "מס. נייר ערך" : "financial_product_number",
    "מנפיק" : "issuer",
    "שיעור מנכסי הקרן (אחוזים)" : "amount_of_public_shares"
  };


//TODO: find by %like%
  var findInDictionary = function(dictionary, key){
    for(dictionaryKey in dictionary){
      if(dictionary.hasOwnProperty(key)){
        return dictionary[key];
      }

    }
  }

var translatedHeader = {};

//TODO:
//translateHeader
//for()



xlsx.readFile(process.argv[2], function(err, result) {
  if (err) {
    console.log(err);
    return;
  }

  var sheetNum = parseInt(process.argv[3], 10) - 1;

  console.log('Reading sheet ' + sheetNum );
  result.sheets[sheetNum].read(function(err, sheet) {
    

    if (err) {
      console.log(err);
      return;
    }


    //example:
    dataLineNumber = 17;
    headerLineNumber = 12;


    var result = {};

    columnId = "C"; 

    //TODO: iterate
    //TODO 2: translate the header instead of findInDictionary each iteration
    translatedFieldName = findInDictionary(dictionary, sheet(columnId + headerLineNumber));
    result[translatedFieldName] = sheet(columnId + dataLineNumber);

  columnId = "D";
    translatedFieldName = findInDictionary(dictionary, sheet(columnId + headerLineNumber));
    result[translatedFieldName] = sheet(columnId + dataLineNumber);


    console.log(JSON.stringify(result));

  });


});
