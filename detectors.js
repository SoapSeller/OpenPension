var LevDistance = require('./LevDistance');

var levTolerance = 2;

function debugM(name,message /*,...*/ ){
	if (global.debug){
		var args = Array.apply(null, arguments);
		console.log.apply(null,["#DEBUG",args.shift(),">"].concat(args));
	}
}

function notifyM(name, message /*,...*/){
	var args = Array.apply(null, arguments);
	console.log.apply(null, ["#NOTIFY", args.shift(),">"].concat(args));
}


exports.cleanColumnHeaderStr = cleanColumnHeaderStr = function(inputStr){
	if (inputStr)
		return inputStr.replace(/\(.*\)/g,"").replace(/["'\n\r]/g,"").replace(/[ ]+/g," ").replace(/^.\. /,"").trim()
	else 
		return ""
}