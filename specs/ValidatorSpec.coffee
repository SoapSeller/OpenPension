Helpers = require './Helpers'
validator = require '../validator'

describe "Validator Spec",->

	it "validates mezumanim",->
		asyncSpecWait()
		validateRows("מזומנים","",[
			{asset : "Migdal_2013_3_414", rows : 27}
		])



validateRows = (instrumentType,instrumentSubType, assetToRows)->
	if (assetToRows.length == 0)
		asyncSpecDone()
	else 
		atr = assetToRows.shift()
		Helpers.parseXLSX atr.asset, (pXlsx)->
			idx = Helpers.resolveIdx(instrumentType,instrumentSubType)
			validated = validator.validate(pXlsx[idx].engMap, pXlsx[idx].data,idx)
			# console.log(JSON.stringify(validated))
			expect(validated.length).toEqual(atr.rows)
			validateRows(instrumentType,instrumentSubType,assetToRows)


