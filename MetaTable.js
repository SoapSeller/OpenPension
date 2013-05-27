
exports.getMetaTable = function(){

	var parsedLines = require('fs').readFileSync('mt_source.csv').toString().split("\n")
	// .map(function(l){ console.log(l.split(",")) })

	var metaTable = {
		hebrewColumns: 			parsedLines.shift().split(",").slice(2,parsedLines[0].length),
		englishColumns: 		parsedLines.shift().split(",").slice(2,parsedLines[0].length),
		instrumentTypes: 		parsedLines.map(function(l){return l.split(",")[0]}),
		instrumentSubTypes : 	parsedLines.map(function(l){return l.split(",")[1]}),
		dataMapping: parsedLines.map(function(l){ return l.split(",").slice(2,l.split(",").length) })
	}

	return metaTable;
}