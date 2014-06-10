var program = require('commander');
var xlsx = require('./xlsxparser.js');
var db = require('./db.js');
var CSVWriter = require('./CSVWriter')
var MetaTable = require('./common/MetaTable');

program
	.command('import')
	.option("-f, --file <name>","file name")
	.option("-y, --year <year>", "year")
	.option("-q, --quarter <quarter>", "quarter")
	.option("-b, --body <body>", "body")
	.option("-m, --monkey <monkey>", "monkey")
	.action(function(args){
		require('./genericImporter').parseXls(args.file, function(result){
			var metaTable = MetaTable.getMetaTable();
			var validated =  result.map(function(r){
				var validated = require('./validator').validate(r.engMap,r.data,r.idx)
				var instrument = metaTable.instrumentTypes[r.idx];
				var instrumentSub = metaTable.instrumentSubTypes[r.idx];
				CSVWriter.write(args.body, args.monkey, args.year, args.quarter, r.idx, instrument, instrumentSub, validated,r.engMap)
			})


			// args.body, args.year, args.quarter, parseInt(args.monkey)
		});
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
		tableWriter("migdal", 2013, 1, "in_id", "in_sub_id", [
			["inst1", "1/10/2004"],
			["inst2", "2/10/2004 x"]
		]);
	});

program
  .command("createtable")
  .action(function(){
    var pg = require('./db').pg;
    var db = new pg();
    // done
  });

program
	.command("fetch")
	.action(function(){
		require('./fetcher').fetchAll();
	});

program
	.command("fetch-harel")
	.action(function(){
		require('./fetcher').fetchHarel();
	});

program
	.command("fetch-known")
	.action(function(){
		require('./fetcher').fetchKnown();
	});

program
	.command("fetch-menora")
	.action(function(){
		require('./fetcher').fetchMenora();
	});

program
	.command("fetch-amitim")
	.action(function(){
		require('./fetcher').fetchAmitim();
	});


program
	.command("load-dir")
	.option("-d, --dir <name>","directory name")
	.action(function(args){
		require("./files_loader").loadDir(args.dir);
	})

program.parse(process.argv);

