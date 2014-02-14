genericImporter = require '../../genericImporter'

parsedXMLCache = {}

load = (assetName, callback)->
	filepath = "#{__dirname}/#{assetName}.xlsx"
	if parsedXMLCache[filepath] then callback(parsedXMLCache[filepath])
	else
		genericImporter.parseXls filepath,"TESTING","1980","1","000", (result)->
			parsedXMLCache[filepath] = result
			load(assetName, callback)

exports.load = load
