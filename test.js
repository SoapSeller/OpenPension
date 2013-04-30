// var fs = require('fs'),
//     parseString = require('xml2js').parseString;

// var filename = "xl/worksheets/sheet6.xml";

// fs.readFile(filename, "utf8", function(err, data) {


//   parseString(data, function (err, result) {
//     console.log(result.worksheet.sheetData[0].row[10].c[4]);
//     process.exit(0);
//   });
// });

var xlsx = require('./xlsxparser.js');

xlsx.readFile(process.argv[2], function(err, result) {
  if (err) {
    console.log(err);
    return;
  }

  console.log('Sheets in file: ');

  result.sheets.forEach(function(s) {
    console.log(s.id + ": " + s.name);
  });

  var sheetNum = parseInt(process.argv[3], 10) - 1;
  console.log('Reading sheet ' + sheetNum + ' cell ' + process.argv[4]);
  result.sheets[sheetNum].read(function(err, sheet) {
    if (err) {
      console.log(err);
      return;
    }
    console.log('Value: ' + sheet(process.argv[4]));
  });
});
