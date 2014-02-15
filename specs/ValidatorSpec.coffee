Helpers = require './Helpers'
validator = require '../validator'

describe "Validator Spec",->

	it "validates mezumanim",->
		asyncSpecWait()
		validateRows("מזומנים","",[
			{asset : "Migdal_2013_3_414", rows : 27}
		])

	it "validates noyarot ereh shirim teudot hithayvot mimshaltiyot",->
		asyncSpecWait()
		validateRows("ניירות ערך סחירים","תעודות התחייבות ממשלתיות",[
			{asset : "Migdal_2013_3_414", rows : 26}
		])

	it "validates noyarot ereh shirim teudot hov mishariyot",->
		asyncSpecWait()		
		validateRows("ניירות ערך סחירים","תעודות חוב מסחריות",[
			
		])
			
	it "validates noyarot ereh shirim agah konzerni",->
		asyncSpecWait()
		validateRows("ניירות ערך סחירים",'"אג""ח קונצרני"',[
			{asset : "Migdal_2013_3_414", rows : 192}
		])

	it "validates noyarot ereh shirim menayot",->
		asyncSpecWait()
		validateRows("ניירות ערך סחירים",'מניות',[
			{asset : "Migdal_2013_3_414", rows : 149}
		])

	it "validates noyarot ereh shirim teudot sal",->
		asyncSpecWait()
		validateRows("ניירות ערך סחירים",'תעודות סל',[
			{asset : "Migdal_2013_3_414", rows : 72}
		])

	it "validates noyarot ereh shirim kranot neemanut",->
		asyncSpecWait()
		validateRows("ניירות ערך סחירים",'קרנות נאמנות',[
			{asset : "Migdal_2013_3_414", rows : 13}
		])

	it "validates noyarot ereh shirim kitvei optziya",->
		asyncSpecWait()
		validateRows("ניירות ערך סחירים",'כתבי אופציה',[
			{asset : "Migdal_2013_3_414", rows : 9}
		])

	it "validates noyarot ereh LO shirim teudot hithayvut mimshaltiyot",->
		asyncSpecWait()
		validateRows("ניירות ערך לא סחירים",'תעודות התחייבות ממשלתיות',[
			{asset : "Migdal_2013_3_414", rows : 126}
		])

	it "validates noyarot ereh LO shirim agah konzerni",->
		asyncSpecWait()
		validateRows("ניירות ערך לא סחירים",'"אג""ח קונצרני"',[
			{asset : "Migdal_2013_3_414", rows : 23}
		])

	it "validates noyarot ereh LO shirim menayot",->
		asyncSpecWait()
		validateRows("ניירות ערך לא סחירים",'מניות',[
			
		])

	it "validates noyarot ereh LO shirim kranot hashkaa",->
		asyncSpecWait()
		validateRows("ניירות ערך לא סחירים",'קרנות השקעה',[
			{asset : "Migdal_2013_3_414", rows : 1}
		])

	it "validates noyarot ereh LO shirim kitvei optziya",->
		asyncSpecWait()
		validateRows("ניירות ערך לא סחירים",'כתבי אופציה',[
			{asset : "Migdal_2013_3_414", rows : 3}
		])

	it "validates noyarot ereh LO shirim optiyot",->
		asyncSpecWait()
		validateRows("ניירות ערך לא סחירים",'אופציות',[
			
		])

	it "validates noyarot ereh LO shirim hozim atidiim",->
		asyncSpecWait()
		validateRows("ניירות ערך לא סחירים",'חוזים עתידיים',[
			{asset : "Migdal_2013_3_414", rows : 19}
		])

	# it "validates halvaot",->
	# 	asyncSpecWait()
	# 	validateRows("הלוואות",'',[
	# 		{asset : "Migdal_2013_3_414", rows : 44}
	# 	])

	it "validates pikdonot",->
		asyncSpecWait()
		validateRows("פקדונות",'',[
			
		])

	it "validates zhuyot mekarkeyin",->
		asyncSpecWait()
		validateRows("זכויות מקרקעין",'',[
			{asset : "Migdal_2013_3_414", rows : 1}
		])

	it "validates hashkaot aherot",->
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
			# console.log(JSON.stringify(validated));
			# process.exit();
			expect(validated.length).toEqual(atr.rows)
			validateRows(instrumentType,instrumentSubType,assetToRows)


