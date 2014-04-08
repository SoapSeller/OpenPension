var NOT_FOUND = -1;

var fs = require('fs'),
    zip = require('node-zip'),
    parseString = require('xml2js').parseString;

var fileDataInUtf8 = function(uz, fname) {
      return new Buffer(uz.files[fname].data, 'ascii').toString('utf8');
};


var trim = function (s) {
  s = s.replace(/(^\s*)|(\s*$)/gi, "");
  s = s.replace(/[ ]{2,}/gi, " ");
  s = s.replace(/\n /, "\n");
  return s;
}



/*
Sometimes empty cells are reduced and ommitted from the xml structure.
this can cause a single row->column (cell) to be reduced,
or the whole row is reduced.
This will ruin the corellation between cell index and cell id.
Thus when looking the fetched cell by index doesnt fit the cell id
we will have to manually look for it.

as this is kinda ugly, we might want to iteratively look for the cell in the first place 

*/



var cellIdToCellIdxLogical = function(cellId) {

  var i, col = 0;
  for ( i = 0; i < cellId.length; ++i) {
    if (cellId[i] < 65) {
      break;
    }

    col *= 10;
    col += cellId.charCodeAt(i) - 65;  // cell[i] - 'A'; zero based
  }

  var row = parseInt(cellId.substr(i), 10) - 1;  // the row number the user is looking for (zero-based)

  return {
    row : row,
    col : col
  };
}

var cellIdToCellIdx = function(sheet, cellIdxAlpha){

  var logicalIndex = cellIdToCellIdxLogical(cellIdxAlpha);

  var col = logicalIndex.col;
  var row = logicalIndex.row;
  var oneBasedRow = row + 1;

  if (!sheet.worksheet.sheetData[0].row){
	return { row: -1, col: -1 }
  }

  var found = sheet.worksheet.sheetData[0].row.reduce(function(found,r,rIdx){
    if (found.row == -1 && parseInt(r.$.r) == oneBasedRow){
      found.row = rIdx;
      found.col = (r.c || []).reduce(function(resC,c,cIdx){
        if (resC == -1 && c.$.r == cellIdxAlpha){
          return cIdx;
        } else {
          return resC;
        }
      },-1)
      return found;
    } else {
      return found;
    }
  },{ row: -1, col: -1 })

  return found;
}

var readSheetCell = function (uz, sharedStrings, sheet, cellId) {

  var idx = cellIdToCellIdx(sheet, cellId);

  //if row or column are not found, maybe have been reduced, return empty string
  if (idx.row == NOT_FOUND || idx.col == NOT_FOUND) {
    return "";
  }

  var cellValue = sheet.worksheet.sheetData[0].row[idx.row].c[idx.col].v;
  var cellStyle = sheet.worksheet.sheetData[0].row[idx.row].c[idx.col].$.s;
  var cellType = sheet.worksheet.sheetData[0].row[idx.row].c[idx.col].$.t;


  // if (cellStyle == 19)
  //   console.log(cellValue);

  // console.log(sheet.worksheet.sheetData[0].row[idx.row].c[idx.col]);
  // console.log(sheet.sharedStrings)
  //25567 - 2
  // console.log("cellStyle:"+cellStyle);
  // console.log("cellType:"+cellType);
  // console.log("cellValue:"+cellValue);

  if (cellType == "s") { //cell type is shared string value
    if (sharedStrings[cellValue].t[0].hasOwnProperty("$")) { //cells with xml:space="preserve"
      if (sharedStrings[cellValue].t[0].hasOwnProperty("_")) { //has inner value
        return trim(sharedStrings[cellValue].t[0]._); //return trimmed value
      } 
      else{ //empty string, only space
        return "";
      }
    } 
    else{ //regular cell, not having xml:space="preserve"
      return sharedStrings[cellValue].t[0];
    }

  }


  if (cellValue === undefined) { //cell is empty
    return "";
  } 
  else {

    return cellValue[0];
  }

};

var getDimension = function(sheet) {
  var splt = sheet.worksheet.dimension[0].$.ref.split(":");
  return {
    min : cellIdToCellIdxLogical(splt[0]),
    max : cellIdToCellIdxLogical(splt[1]),
    minIdx : cellIdToCellIdx(sheet, splt[0]),
    maxIdx : cellIdToCellIdx(sheet, splt[1])
  };
};

// handler = function(err, result)
var readSheet = function(uz, sharedStrings,sheetId, handler) {

  parseString(fileDataInUtf8(uz, 'xl/worksheets/sheet' + sheetId + '.xml'), function (err, sheet) {
    if (err) {
      handler(err, null);
      return;
    }

    handler(null, readSheetCell.bind(this, uz, sharedStrings, sheet), getDimension(sheet));
  });
};

// handler = function(err, result)
exports.readFile = function(filename, handler) {

  fs.exists(filename, function(fileok) {
    if (fileok)
      fs.readFile(filename, "binary", function(err, data) {
        if (err) {
          handler(err, null);
          return;
        }
        var uz;
        try {
          uz = new zip(data, {
            base64 : false,
            checkCRC32 : true
          });
        } catch(e) {
          handler(null, e);
          return;
        }

        parseString(fileDataInUtf8(uz, 'xl/sharedStrings.xml'), function(err, sharedStrings) {
          if (err) {
            handler(err, null);
            return;
          }

          parseString(fileDataInUtf8(uz, 'xl/workbook.xml'), function(err, workbook) {
            if (err) {
              handler(err, null);
              return;
            }

            var result = {
              sheets : []
            };
            workbook.workbook.sheets[0].sheet.forEach(function(s) {
              //console.log(s);
              result.sheets.push({
                name : s.$.name,
                id : s.$.sheetId,
                read : readSheet.bind(this, uz, sharedStrings.sst.si, s.$.sheetId)
              });
            });
            handler(null, result);
          });
        });
      });
    
else
      console.log("file not found");
  });

};

/*
@param String filename
@param Function(Error, [sheet1,sheet2,...])
*/
exports.getFileSheetsNames = function(fileName, callback){
  exports.readFile(fileName, function(err, result) {
    callback(null,result.sheets.map(function(s){return s.name;}));
  });
};


/*
@param String filename
@param String sheet
@param String cellName
@param Function(Error,value) callback
*/
exports.getCellValue = function(filename, sheet, cellName, callback){
  exports.readFile(filename, function(err, result) {
    var _sheet = result.sheets.filter(function(s){return s.name == sheet;})[0];
    if (!_sheet) throw new Error("sheet not found!");
    _sheet.read(function(err,result){
      var value = result(cellName);
      callback(null,value);
    });
  });
};

/*
@param String filename
@param String sheet
@param Function(Error,dim) callback
*/
exports.getDimensions = function(filename, sheet, callback){
  exports.readFile(filename, function(err, result) {
    var _sheet = result.sheets.filter(function(s){return s.name == sheet;})[0];
    if (!_sheet) throw new Error("sheet not found!");
    _sheet.read(function(err,result,dim){
      callback(null,dim);
    });
  });
};

exports.openSheet = function(filename, sheet, callback){
  exports.readFile(filename, function(err, result) {
    var _sheet = result.sheets.filter(function(s){return s.name == sheet;})[0];
    if (!_sheet){
      callback(new Error("sheet not found!"));
      return;
    }
    _sheet.read(callback);
  });
};

exports.getSheets = function(filename, callback){
  exports.readFile(filename, function(err, result) {
    callback(result.sheets);
  })
}

