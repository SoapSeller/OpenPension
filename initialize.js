var Promise = require('bluebird');
var mkdirp = Promise.promisify(require('mkdirp'));




exports.init = function(){

	return mkdirp('./tmp') 
	.then(function(){ mkdirp('./res') })
	.then(function(){ console.log("Initialized.")});
}
