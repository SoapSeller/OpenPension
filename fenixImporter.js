var xlsx = require("./xlsxparser")

var fileName ="fenix.xlsx"
var sheetName="נ\"ע סחירים_ אג\"ח קונצרני";


xlsx.openSheet(fileName, sheetName, function(err, getCell, dim){
		for(var i=1; i < dim.maxIdx.row + 1; i++){
			console.log(getCell("A" + i))
		}
});

// xlsx.getDimensions(fileName, sheetName, function(err, dim){
// 	xlsx


// 	xlsx.readFile(fileName, function(err, result) {
// 		    if (!_sheet) throw new Error("sheet not found!");
//     _sheet.read(function(err,result,dim){
//       callback(null,dim);
//     });
// 	});
// 	// for(var i=1; i < dim.maxIdx.row + 1; i++){
// 	// 	xlsx.getCellValue(fileName, sheetName,"A" + i,function(err, result){
// 	// 		console.log("Cell value:",result);		})
// 	// }
// })