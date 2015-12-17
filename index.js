var fs = require('fs');
var program = require('commander');
var db = require('./db.js');
var dirs = require('./dirs');

//convert excel file(s) in directory to csv
program
	.command("convert-files")
	.description("convert excel files to csv")
	.option("-y, --year <year>", "year")
	.option("-q, --quarter <quarter>", "quarter")
	.option("-b, --body <body>", "body")
	.option("-f, --fund <fund number>", "fund")
	.option("-s, --srcdir <name>","path of Excel files, default:"+dirs.excel)
	.option("-t, --trgdir <name>","path of CSV files, default:"+dirs.csv)
	.option("-o, --overwrite","overwrite existing CSV files, default: false")
	.action(function(args){
		if (!process.argv.slice(3).length) {
			this.outputHelp();
			return;
		}
		var srcdir = args.srcdir || dirs.excel;
		var trgdir = args.trgdir || dirs.csv;
		var overwrite = args.overwrite || false;
		try{
			require("./files_loader").convertFilesCmd(args.body, args.fund, args.year, args.quarter, srcdir, trgdir, overwrite);
		}
		catch(err){
			console.error("Error:" + err);
		}

	})

//create table in database
program
	.command("db-create-table")
	.description("create table in database")
	.option("-t, --table <name>","table name")
	.action(function(args){
		if (!process.argv.slice(3).length) {
			this.outputHelp();
			return;
		}

		try{
			require('./db').createTable(args.table);
		}
		catch(err){
			console.error("Error:" + err);
		}
	});

//truncate table in database
program
	.command("db-empty-table")
	.description("truncate table in database")
	.option("-t, --table <name>","table name")
	.action(function(args){
		if (!process.argv.slice(3).length) {
			this.outputHelp();
			return;
		}
		try{
			require('./db').emptyTable(args.table);
		}
		catch(err){
			console.error("Error:" + err);
		}

  });

//load files to database
program
	.command("db-load-files")
	.description("load csv files to database")
	.option("-y, --year <year>", "year")
	.option("-q, --quarter <quarter>", "quarter")
	.option("-b, --body <body>", "body")
	.option("-f, --fund <fund number>", "fund number")
	.option("-t, --table <name>","table name")
	.option("-s, --srcdir <name>","path of CSV files, default:"+dirs.csv)
	.option("-c, --concurrency <number>","number of concurrent DB connections, defaults to 4")
	.action(function(args){
		if (!process.argv.slice(3).length || !args.table) {
			this.outputHelp();
			return;
		}

		var srcdir = args.srcdir || dirs.csv;

		try{
			require('./dbLoader').importFilesCmd(srcdir, args.body, args.year, args.quarter, args.fund,
				args.table, args.concurrency);
		}
		catch(err){
			console.error("Error:" + err);
		}
	});

// program
// 	.command("dump-funds")
// 	.description("create csv files from database data")
// 	.action(function(){
// 		require('./fetcher').dumpFunds();
// 	});

//download and convert files in Google Doc
program
	.command("fetch-google")
	.description("download and convert files in Google Doc.")
	.option("-y, --year <year>", "year")
	.option("-q, --quarter <quarter>", "quarter")
	.option("-b, --body <body>", "body")
	.option("-f, --fund <fund number>", "fund number")
	.option("-t, --trgdir <name>","path of Excel files, default:"+dirs.excel)
	.action(function(args){
		if (!process.argv.slice(3).length) {
			this.outputHelp();
			return;
		}

		var trgdir = args.trgdir || dirs.excel;

		try{
			require('./fetcher').fetchKnown(args.body, args.year, args.quarter, args.fund, trgdir);
		}
		catch(err){
			console.error("Error:" + err);
		}
	});

//download and convert contributed files
// program
//     .command("fetch-contrib")
//     .description("download and convert contributed files")
//     .action(function(){
//         require('./fetcher').fetchContrib();
//     });


if (!process.argv.slice(2).length) {
	program.outputHelp();
	return;
}

program.parse(process.argv);


