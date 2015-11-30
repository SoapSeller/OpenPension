var path = require('path');


var excel = __dirname + '/res/';
var csv = __dirname + '/tmp/';

module.exports.csv = csv;
module.exports.excel = excel;
module.exports.root = __dirname;

console.log(module.exports.csv);