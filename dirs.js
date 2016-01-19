var Utils = require(__dirname + '/utils.js')
var excel = __dirname + '/excel/';
var csv = __dirname + '/csv/';

Utils.mkdirIfNotExists(csv);
Utils.mkdirIfNotExists(excel);

module.exports.csv = csv;
module.exports.excel = excel;
module.exports.root = __dirname;
