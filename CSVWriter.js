DB = require('./db')

exports.write = function(managingBody, fund, year, quarter, tabIndex, instrument, instrumentSub, tabData,headers){
	var filename = "./tmp/" + [ managingBody, fund, year, quarter].join("_") + ".csv";
	DB.csv.write(filename, headers,managingBody, fund, year, quarter, instrument, instrumentSub, tabData);
}
