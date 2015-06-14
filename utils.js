var path = require("path");

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