var fsep = require('fs-extra-promise');


exports.init = function(){

	return fsep.ensureDirAsync('./tmp') 
	.then(fsep.ensureDirAsync('./res'));

}

exports.clean = function(){

	return fsep.removeAsync('./tmp')
	.then(fsep.removeAsync('./res'))
	.then(exports.init);

}