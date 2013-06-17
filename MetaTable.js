exports.getMetaTable = function(){

	var parsedLines = require('fs').readFileSync('mt_source.csv').toString().split("\n")

	//TODO: trim all values
	var metaTable = {
		hebrewColumns: 			parsedLines.shift().split(",").slice(2,parsedLines[0].length),
		//TODO: make english words lower case and underscore instead of spaces + trim
		englishColumns: 		parsedLines.shift().split(",").slice(2,parsedLines[0].length),
		dataTypes: 				parsedLines.shift().split(",").slice(2,parsedLines[0].length),
		measures: 				parsedLines.shift().split(",").slice(2,parsedLines[0].length),
		instrumentTypes: 		parsedLines.map(function(l){return l.split(",")[0]}),
		instrumentSubTypes : 	parsedLines.map(function(l){return l.split(",")[1]}),
		dataMapping: 			parsedLines.map(function(l){ return l.split(",").slice(2,l.split(",").length) }),
		columnMappingForRow: 	function(rowId){
			var output = [];
			for (var i = 0; i < this.dataMapping[rowId].length ; i++ ){
				var rowValue = parseInt(this.dataMapping[rowId][i]);
				if (rowValue){
					output[rowValue -1] = this.hebrewColumns[i];
				}
			}
			return output;
		}
	}

	return metaTable;
}