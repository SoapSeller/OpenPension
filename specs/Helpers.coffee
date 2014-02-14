mt = require('../common/MetaTable').getMetaTable()

exports.resolveIdx = (instrumentType,instrumentSubType)->
	for it, x in mt.instrumentTypes
		if it == instrumentType and mt.instrumentSubTypes[x] == instrumentSubType
			return x
	throw "could not find idx for #{instrumentType} #{instrumentSubType}"
