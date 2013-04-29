var fs = require('fs'),
    zip = require('node-zip'),
    parseString = require('xml2js').parseString;

var fileDataInUtf8 = function(uz, fname) {
      return new Buffer(uz.files[fname].data, 'ascii').toString('utf8');
};


var readSheetCell = function(sheet, cell) {
  var row = 0,
      col = 0;

  var i;
  for (i = 0; i < cell.length; ++i) {
    if (cell[i] < 65) {
      break;
    }

    col *= 10;
    col += cell.charCodeAt(i) - 65; // cell[i] - 'A';
  }

  row = parseInt(cell.substr(i), 10) - 1;

  return sheet.worksheet.sheetData[0].row[row].c[col].v[0];
};


// handler = function(err, result)
var readSheet = function(uz, sheetId, handler) {
  
  parseString(fileDataInUtf8(uz, 'xl/worksheets/sheet' + sheetId + '.xml'), function (err, sheet) {
    if (err) {
      handler(err, null);
      return;
    }
    console.log(sheet.worksheet.dimension)

    handler(null, readSheetCell.bind(this, sheet));
  });
};


// handler = function(err, result)
exports.readFile = function(filename, handler) {
  fs.readFile(filename, "binary", function(err, data) {
    if (err) {
      handler(err, null);
      return;
    }
    var uz;
    try{
      uz = new zip(data, { base64: false, checkCRC32: true});
    } catch(e) {
      handler(null, e);
      return;
    }



    parseString(fileDataInUtf8(uz, 'xl/workbook.xml'), function (err, workbook) {
      if (err) {
        handler(err, null);
        return;
      }

      var result = {
        sheets: []
      };
      workbook.workbook.sheets[0].sheet.forEach(function(s){
        // console.log(s);
        result.sheets.push({
          name: s.$.name,
          read: readSheet.bind(this, uz, s.$.sheetId)
          // bounderies: cellName.bind(this, )
        });
      });
      handler(null, result);
    });
  });

};


exports.getFileSheetsNames = function(fileName, callback){
  exports.readFile(fileName, function(err, result) {
    callback(null,result.sheets.map(function(s){return s.name}));
  })
}

exports.getCellValue = function(filename, sheet, cellName, callback){
  exports.readFile(filename, function(err, result) {
    var _sheet = result.sheets.filter(function(s){return s.name == sheet})[0]
    if (!_sheet) throw new Error("sheet not found!");
    _sheet.read(function(err,result){
      var value = result(cellName);
      callback(null,value);
    })
  })
}

