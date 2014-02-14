genericImporter = require '../genericImporter'
mt = require('../common/MetaTable').getMetaTable()

exports.resolveIdx = (instrumentType,instrumentSubType)->
	for it, x in mt.instrumentTypes
		if it == instrumentType and mt.instrumentSubTypes[x] == instrumentSubType
			return x
	throw "could not find idx for #{instrumentType} #{instrumentSubType}"

parsedXMLCache = {}

exports.parseXLSX = parseXLSX = (assetName, callback)->
	filepath = "#{__dirname}/assets/#{assetName}.xlsx"
	if parsedXMLCache[filepath] then callback(parsedXMLCache[filepath])
	else
		genericImporter.parseXls filepath,(result)->
			parsedXMLCache[filepath] = result
			parseXLSX(assetName, callback)
