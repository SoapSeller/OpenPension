var fsep = require('fs-extra-promise');


exports.init = function(){

	return fsep.ensureDirAsync('./tmp') 
	.then(fsep.ensureDirAsync('./res'));

}

exports.clean = function(){

	//TODO: are you sure?

	return fsep.removeAsync('./res')
	// .then(fsep.removeAsync('./tmp'))
	.then(exports.init);

}