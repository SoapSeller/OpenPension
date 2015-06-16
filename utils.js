var path = require("path");
var _ = require("underscore");

exports.filename = function(folder, fund, ext){

	if (ext.indexOf("?") != -1){

		ext = ext.split("?")[0];
		ext = ext.toLowerCase();

	}

	// var baseName = folder + [fund.body, fund.year, fund.quarter, fund.number].join("_");
	var baseName = path.join(folder,[fund.body, fund.year, fund.quarter, fund.number].join("_"));

    return (baseName + ext).toLowerCase();    	


	// var baseName = path.join(folder,[fund.body, fund.number, fund.year, fund.quarter].join("_"));

    // return baseName + ext;    	

};


exports.getFundObj = function(body, year, quarter, number){
	return {
		body: body,
		year: year,
		quarter: quarter,
		number: number
	}
}

exports.getFundFromFile = function(filename){
		var _s = filename.split("_");

		return {
			body : _s[0],
			year : _s[1],
			quarter :  _s[2],
			number : _s[3].split('.')[0]
		};
}

exports.filterFunds = function(allFunds, body, year, quarter, fund_number) {

	var chosenFunds = allFunds.filter(function(f){
		return (body == undefined? true: f.body == body ||  ( _.isArray(body) && body.indexOf(f.body) > -1 ) ) 
		&& (fund_number == undefined ? true: f.number == fund_number ||  ( _.isArray(fund_number) && fund_number.indexOf(f.number) > -1 ))
		&& (year == undefined ? true: f.year == year ||  ( _.isArray(year) && year.indexOf(f.year) > -1 ))
		&& (quarter == undefined? true: f.quarter == quarter ||  ( _.isArray(quarter) && quarter.indexOf(f.quarter) > -1 ))
	})

	return chosenFunds;
};


exports.filterFiles = function(allFiles, body, year, quarter, fund_number) {

	var funds = allFiles.map(exports.getFundFromFile);

	var chosenFiles = allFiles.filter(function(file){
		
		var f = exports.getFundFromFile(file);

		return (body == undefined? true: f.body == body ||  ( _.isArray(body) && body.indexOf(f.body) > -1 ) ) 
		&& (fund_number == undefined ? true: f.number == fund_number ||  ( _.isArray(fund_number) && fund_number.indexOf(f.number) > -1 ))
		&& (year == undefined ? true: f.year == year ||  ( _.isArray(year) && year.indexOf(f.year) > -1 ))
		&& (quarter == undefined? true: f.quarter == quarter ||  ( _.isArray(quarter) && quarter.indexOf(f.quarter) > -1 ))
	})

	return chosenFiles;
};

