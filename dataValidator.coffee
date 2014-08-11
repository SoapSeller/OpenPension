detectors = require './detectors'

formatHeadersKey = (instrument, instrumentSub)->
	detectors.cleanColumnHeaderStr(instrument) + "," + detectors.cleanColumnHeaderStr(instrumentSub)

exports.validate = (extracted, metaTable,company,year,q,fund)->
	totals = null
	found = {}
	extracted.forEach (x)->
		if x.instrument == "סכום נכסי הקרן"
			totals = x.validated
		else found[formatHeadersKey(x.instrument, x.instrumentSub)] = x.validated;

	console.log Object.keys(found)

	 
	

