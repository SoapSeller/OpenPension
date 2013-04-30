var program = require('commander');
var xlsx = require('./xlsxparser.js');

program
	.command("get-cell")
	.description("Get data from a cell")
	.option("-f, --file <path>","file nane")
	.option("-c, --cell <cell>","cell in Excell format: D6 or BA90")
	.option("-s, --sheet <sheet>","sheet name")
	.action(function(args){
		xlsx.getCellValue(args.file, args.sheet,args.cell,function(err, result){
			console.log("Cell value:",result);
		})
	})

program
	.command("list-sheets")
	.description("List available sheets for file")
	.option("-f, --file <path>","file nane")
	.action(function(args){
		xlsx.getFileSheetsNames(args.file, function(err, sheets){
			console.log("Sheet names:",sheets.join(","));
		});
	})

program.parse(process.argv);
