var fs = require('fs');
var program = require('commander');
var xlsx = require('./xlsxparser.js');
var db = require('./db.js');
var CSVWriter = require('./CSVWriter')
var MetaTable = require('./common/MetaTable');
var initialize = require('./initialize');


//creates system dirs on first run
program
	.command("init", "create system directories")
	.action(function(args){
		require('./initialize').init()
		.then(function(){
			console.log('initialized.')
		});
	})


//clean system dirs (deletes files!)
program
	.command("clean", "clean (delete files) in system directories")
	.action(function(args){
		require('./initialize').clean()
		.then(function(){
			console.log('cleaned.')
		});
	})

//convert excel file(s) in directory to csv
program
	.command("convert-files", "convert excel files to csv")
	.option("-d, --dir <name>","directory name")
	.option("-y, --year <year>", "year")
	.option("-q, --quarter <quarter>", "quarter")
	.option("-b, --body <body>", "body")
	.option("-m, --monkey <monkey>", "monkey")
	.action(function(args){
		require("./files_loader").convertFiles(args.dir, args.body, args.monkey, args.year, args.quarter);
	})

//create table in database
program
  .command("db-create-table", "create table in database")
  .option("-t, --table <name>","table name")
  .action(function(args){
    require('./db').createTable(args.table);
  });

//truncate table in database
program
  .command("db-empty-table", "truncate table in database")  
  .option("-t, --table <name>","table name")
  .action(function(args){
    require('./db').emptyTable(args.table);
  });

program
	.command("dump-funds", "create csv files from database data")
	.action(function(){
		require('./fetcher').dumpFunds();
	});

//download and convert files in Google Doc
program
	.command("fetch-known", "download and convert files in Google Doc")
	.option("-y, --year <year>", "year")
	.option("-q, --quarter <quarter>", "quarter")
	.option("-b, --body <body>", "body")
	.option("-m, --monkey <monkey>", "monkey")
	.action(function(args){
		require('./fetcher').fetchKnown(args.body, args.year, args.quarter, args.monkey);
	});

//download and convert contributed files
program
    .command("fetch-contrib", "download and convert contributed files")
    .action(function(){
        require('./fetcher').fetchContrib();
    });

//load files to database
program
	.command("db-load-files", "load csv files to database")
	.option("-d, --dir <name>","directory name")
	.option("-y, --year <year>", "year")
	.option("-q, --quarter <quarter>", "quarter")
	.option("-b, --body <body>", "body")
	.option("-f, --fund <fund number>", "fund number")
	.option("-t, --table <name>","table name")
	.option("-c, --concurrency <number>","number of concurrent DB connections, defaults to 4")
	.action(function(args){
		require('./dbLoader').importFilesCmd(args.dir, args.body, args.year, args.quarter, args.fund, 
			args.table, args.concurrency);
	})

program.parse(process.argv);


