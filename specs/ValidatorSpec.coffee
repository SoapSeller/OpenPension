Helpers = require './Helpers'
validator = require '../validator'

describe "Validator Spec",->

	it "validates mezumanim",->
		asyncSpecWait()
		validateRows("מזומנים","",[
			{asset : "Migdal_2013_3_414", rows : 27}
		])

	it "needs to have noyarot ereh shirim teudot hithayvot mimshaltiyot",->
		asyncSpecWait()
		validateRows("ניירות ערך סחירים","תעודות התחייבות ממשלתיות",[
			{asset : "Migdal_2013_3_414", rows : 26}
		])

	it "needs to have noyarot ereh shirim teudot hov mishariyot",->
		asyncSpecWait()		
		validateRows("ניירות ערך סחירים","תעודות חוב מסחריות",[
			
		])
			
	it "needs to have noyarot ereh shirim agah konzerni",->
		asyncSpecWait()
		validateRows("ניירות ערך סחירים",'"אג""ח קונצרני"',[
			{asset : "Migdal_2013_3_414", rows : 192}
		])

	it "needs to have noyarot ereh shirim menayot",->
		asyncSpecWait()
		validateRows("ניירות ערך סחירים",'מניות',[
			{asset : "Migdal_2013_3_414", rows : 149}
		])

	it "needs to have noyarot ereh shirim teudot sal",->
		asyncSpecWait()
		validateRows("ניירות ערך סחירים",'תעודות סל',[
			{asset : "Migdal_2013_3_414", rows : 72}
		])

	it "needs to have noyarot ereh shirim kranot neemanut",->
		asyncSpecWait()
		validateRows("ניירות ערך סחירים",'קרנות נאמנות',[
			{asset : "Migdal_2013_3_414", rows : 13}
		])

	it "needs to have noyarot ereh shirim kitvei optziya",->
		asyncSpecWait()
		validateRows("ניירות ערך סחירים",'כתבי אופציה',[
			{asset : "Migdal_2013_3_414", rows : 9}
		])

	it "needs to have noyarot ereh LO shirim teudot hithayvut mimshaltiyot",->
		asyncSpecWait()
		validateRows("ניירות ערך לא סחירים",'תעודות התחייבות ממשלתיות',[
			{asset : "Migdal_2013_3_414", rows : 126}
		])

	it "needs to have noyarot ereh LO shirim agah konzerni",->
		asyncSpecWait()
		validateRows("ניירות ערך לא סחירים",'"אג""ח קונצרני"',[
			{asset : "Migdal_2013_3_414", rows : 23}
		])

	it "needs to have noyarot ereh LO shirim menayot",->
		asyncSpecWait()
		validateRows("ניירות ערך לא סחירים",'מניות',[
			
		])

	it "needs to have noyarot ereh LO shirim kranot hashkaa",->
		asyncSpecWait()
		validateRows("ניירות ערך לא סחירים",'קרנות השקעה',[
			{asset : "Migdal_2013_3_414", rows : 1}
		])

	it "needs to have noyarot ereh LO shirim kitvei optziya",->
		asyncSpecWait()
		validateRows("ניירות ערך לא סחירים",'כתבי אופציה',[
			{asset : "Migdal_2013_3_414", rows : 3}
		])

	it "needs to have noyarot ereh LO shirim optiyot",->
		asyncSpecWait()
		validateRows("ניירות ערך לא סחירים",'אופציות',[
			
		])

	it "needs to have noyarot ereh LO shirim hozim atidiim",->
		asyncSpecWait()
		validateRows("ניירות ערך לא סחירים",'חוזים עתידיים',[
			{asset : "Migdal_2013_3_414", rows : 19}
		])

	it "needs to have halvaot",->
		asyncSpecWait()
		validateRows("הלוואות",'',[
			{asset : "Migdal_2013_3_414", rows : 44}
		])

	it "needs to have pikdonot",->
		asyncSpecWait()
		validateRows("פקדונות",'',[
			
		])

	it "needs to have zhuyot mekarkeyin",->
		asyncSpecWait()
		validateRows("זכויות מקרקעין",'',[
			{asset : "Migdal_2013_3_414", rows : 1}
		])

	it "needs to have hashkaot aherot",->
		asyncSpecWait()
		validateRows("השקעות אחרות",'',[
			
		])



validateRows = (instrumentType,instrumentSubType, assetToRows)->
	if (assetToRows.length == 0)
		asyncSpecDone()
	else 
		atr = assetToRows.shift()
		Helpers.parseXLSX atr.asset, (pXlsx)->
			idx = Helpers.resolveIdx(instrumentType,instrumentSubType)
			pXlsxData = pXlsx.filter((r)-> idx == r.idx).pop()
			validated = validator.validate(pXlsxData.engMap, pXlsxData.data, idx)
			# console.log(JSON.stringify(validated))
			expect(validated.length).toEqual(atr.rows)
			validateRows(instrumentType,instrumentSubType,assetToRows)


