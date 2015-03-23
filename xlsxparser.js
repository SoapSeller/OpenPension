var XLSX = require('./xlsx');
var XLS = require('xlsjs');
var path = require('path');


var trim = function (s) {
  if (s == undefined) return "";
  s = s.replace(/(^\s*)|(\s*$)/gi, "");
  s = s.replace(/[ ]{2,}/gi, " ");
  s = s.replace(/\n /, "\n");
  return s;
}

var cellIdToCellIdx = function(cellId) {

  var i, col = 0;
  for ( i = 0; i < cellId.length; ++i) {
    if (cellId[i] < 65) {
      break;
    }

    if (i == 1 && col == 0){ //for handing "A_"
      col += ("Z".charCodeAt(0) -65 +1);
    }
    
    col += cellId.charCodeAt(i) - 65;  // cell[i] - 'A'; zero based
  }

  // col can not be larger then 50
  // thats silly
  if (col > 50)
    col = 50;

  var row = parseInt(cellId.substr(i), 10) - 1;  // the row number the user is looking for (zero-based)

  return {
    row : row,
    col : col
  };
}



exports.getSheets = function(filename, callback){

    var reader;
    if (path.extname(filename).toLowerCase() == ".xls"){
      reader = XLS;
    }
    else if (path.extname(filename).toLowerCase() == ".xlsx"){
      reader = XLSX;
    }

    if (reader == undefined){
      console.log("No reader found for: "+ filename)
    }


    var workbook = reader.readFile(filename);

    callback(workbook);

}


exports.getDimension = function(workbook, sheetName) {
  var splt;

  if (workbook.Sheets[sheetName]['!ref'] == undefined){
    splt = "A1:A1".split(":");
  }
  else{
    splt = workbook.Sheets[sheetName]['!ref'].split(":")
  }

  return {
    min : cellIdToCellIdx(splt[0] || 'A1'),
    max : cellIdToCellIdx(splt[1] || 'A1')
  };
};
 
exports.readCell = function(workbook, sheetName, cellId){
      var cellContent = workbook.Sheets[sheetName][cellId] == undefined ? "": workbook.Sheets[sheetName][cellId].v;

      if (typeof cellContent === "number") {
        cellContent = cellContent.toString();
      }

      return trim(cellContent);
}

