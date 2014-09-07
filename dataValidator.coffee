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

	extracted.forEach (x)->
		if x.instrument == "סכום נכסי הקרן"
			symbolIdx = x.engMap.indexOf( x.engMap.filter((z)-> z.columnName == "instrument_symbol" )[0] )
			
			x.validated.forEach (y)->
				console.log(y)

	# console.log Object.keys(found)

	 
	

