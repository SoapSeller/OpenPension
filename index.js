var program = require('commander');
var xlsx = require('./xlsxparser.js');
var db = require('./db.js');


var importers = {
	"migdal" : "./migdalImporter.js",
	"fenix" : "./fenixImporter.js",
	"migdal11" : "./migdalImporter.js"
};
program
	.command("get-cell")
	.description("Get data from a cell")
	.option("-f, --file <path>","file nane")
	.option("-c, --cell <cell>","cell in Excell format: D6 or BA90")
	.option("-s, --sheet <sheet>","sheet name")
	.action(function(args){
  xlsx.getCellValue(args.file, args.sheet, args.cell, function(err, result) {
    console.log("Cell value:", result);
  });
});

program
	.command("list-sheets")
	.description("List available sheets for file")
	.option("-f, --file <path>","file nane")
	.action(function(args){
  xlsx.getFileSheetsNames(args.file, function(err, sheets) {
    console.log("Sheet names:", sheets.join(","));
  });
});

program
	.command("get-dim")
	.description("List dimentions of given sheet")
	.option("-f, --file <path>","file nane")
	.option("-s, --sheet <sheet>","sheet name")
	.action(function(args){
  xlsx.getDimensions(args.file, args.sheet, function(err, dim) {
    console.log(dim);
    // console.log("Sheet names:",sheets.join(","));
  });
}),

program
	.command("debug")
	.action(function(){
		require('./genericImporter').parseXls("res/migdal.xlsx","migdal");
	});

program
	.command("db")
	.action(function(){
		var map = [
			{ columnName: "instrument_id" },
			{ columnName: "date_of_purchase" }
		];
		var db = require('./db').open(true);
		var tableWriter = db.openTable(map);
		tableWriter([
			["inst1", "1/10/2004"],
			["inst2", "2/10/2004 x"]
		]);
	});

program
	.command("to-csv")
	.description("Convert sheets in file to CSV")
	.option("-f, --file <path>", "file name")
	.option("-t, --type <type>", "file type")
	.option("-s, --sheet <sheet name>", "sheet name")
	.action(function(args) {

				// var sheetName = "מזומנים ושווי מזומנים";
				var sheetName = args.sheet;
				var type = args.type;
				console.log("importers[type]"+importers[type]);
				var importer = require(importers[type]);

					xlsx.openSheet(args.file, sheetName,
						function(err, getCell, dim){
							var result = importer.convert(err, getCell, dim);
							var outputFileName = "output.csv";
							if (result === undefined ){
								return;
							}
							var jsonRows = result.rows;
							var type = result.type;
							if (jsonRows === undefined){
								return;
							}

							// console.log("got result size: " + jsonRows.length);
							var dbwriter = db.open(outputFileName);
							for (var j = 0; j < jsonRows.length; j++){
								err = dbwriter.writeRecord(type, jsonRows[j]);
								if (err) {
									console.log(err);
								// return;
								}
							}
							dbwriter.close();
						}
			);
});


/*
program
	.command("to-csv")
	.description("Convert sheets in file to CSV")
	.option("-f, --file <path>", "file name")
	.option("-t, --type <type>", "file type")
	.action(function(args) {
	 		xlsx.getFileSheetsNames(args.file, function(err, sheets) {		
				console.log("Sheet names:", sheets.join(","));
				var type = args.type;
				var importer = require('./migdalImporter.js');
				for (var i = 0; i < sheets.length; i++) {
					var sheetName = sheets[i];
					console.log("sheetName:" + sheetName);
			      // var sheetName = "16";
				
					xlsx.openSheet(args.file, sheetName, 
						function(err, getCell, dim) {
						    console.log("dim:"+JSON.stringify(dim));
						
						    var jsonRows = importer.convert(err, getCell, dim);
						    if (jsonRows == undefined){
						    	console.log("continue");
						    	return;
						    }
						        // var jsonRows = [1,1,2];
						    var sheetId = dim.sheetId;
						    console.log("JSON sheets"+JSON.stringify(sheets));
						    console.log("done converting! " + sheetId );
						    console.log("got result size: " + jsonRows.length);
						    var dbwriter = db.open("output.csv");
						    for (var j = 0; j < jsonRows.length; j++) {
						    	var err = dbwriter.writeRecord("stock", jsonRows[j]);
						      if (err) {
						      	console.log(err);
						      	return;
						      }
								}
						    dbwriter.close();
						  }
						 );
			}
	  })
});
*/
program.parse(process.argv);
