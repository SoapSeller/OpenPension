var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));




exports.init = function(){

	return fs.mkdirAsync('./tmp') 
	.then(function(){ fs.mkdirAsync('./res') })
	.then(function(){ console.log("Initialized.")});
}
