var DB = require(__dirname + '/db')
var fs = require('fs'),
	utils = require(__dirname + '/utils.js'),
	dirs = require(__dirname + '/dirs.js'),
	Promise = require('bluebird'),
    metaTable = require(__dirname + '/common/MetaTable').getMetaTable();

var columnsNames = DB.columnsNames;

exports.write = function(managingBody, fund, year, quarter, instrument, instrumentSub, tabData, headers){
	var fund = utils.getFundObj(managingBody, year, quarter, fund);
	var filename = utils.filename(dirs.csv, fund, ".csv");
	DB.csv.write(filename, headers, managingBody, fund, year, quarter, instrument, instrumentSub, tabData);
}

exports.writeParsedResult = function(managing_body, fund_number, report_year, report_qurater, result, trgdir){


	return new Promise(function(resolve, reject){

		var fundObj = utils.getFundObj(managing_body, report_year, report_qurater, fund_number);
		var filename = utils.filename(trgdir, fundObj, ".csv");
		var exists = fs.existsSync(filename);
		// var stream = fs.createWriteStream(filename, { flags: 'a+', encoding: "utf8", mode: 0666 });

		var data = "";
		if (exists){
			console.log("tried to import existing file:" + filename )
			return;
		}
		else{
			// stream.write(columnsNames.join(',') + "\n");
			data = columnsNames.join(',') + "\n";

		}

		result.map(function(r){


			var objects = require(__dirname + '/validator').validate(r.engMap,r.data,r.idx)
			var instrument_type = metaTable.instrumentTypes[r.idx];
			var instrument_sub_type = metaTable.instrumentSubTypes[r.idx];

			mapping = r.engMap;

			mapping = DB.defaultColumnsNamesMapping.concat(mapping);
			
			var indexes = [];
			columnsNames.forEach(function(column) {
				var idx = -1;
				for (i = 0; i < mapping.length; ++i) {
				  if (mapping[i].columnName == column) {
				    idx = i;
				    break;
				  }
				}
				indexes.push(idx);
			});

			objects.forEach(function(object) {
				object = [managing_body, fund_number.toString(), report_year.toString(), report_qurater.toString(), instrument_type, instrument_sub_type].concat(object);

				var str = "";
				for (i = 0; i < indexes.length; ++i) {
				  var idx = indexes[i];
				  if (idx >= 0){
				    str = str + (object[idx] ?  object[idx] : "");
				  }
				  if (i != indexes.length-1) {
				    str = str + ",";
				  } else {
				    str = str + "\n";
				  }
				}
				// stream.write(str);
				data += str;
			});


		});

		fs.writeFileSync(filename, data);
		// stream.end();

		// stream.on('finish', function() {
		// 	resolve();
		// });
		resolve();
	});

}


