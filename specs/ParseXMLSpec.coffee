Helpers = require './Helpers'

describe "ParseXML Spec",->

	# make jasmine wait 50 seconds before timing out..
	jasmine.asyncSpecWait.timeout = 50000

	it "needs to have mezumanim", ->
		asyncSpecWait()
		findTab("מזומנים","",[
			"Migdal_2013_3_414"
			"Migdal_2013_3_579"
			"Migdal_2013_3_99118"
			"harel_2013_3_153"
		])

	it "needs to have noyarot ereh shirim teudot hithayvot mimshaltiyot",->
		asyncSpecWait()		
		findTab("ניירות ערך סחירים","תעודות התחייבות ממשלתיות",[
			"Migdal_2013_3_414"
			"Migdal_2013_3_579"
			"Migdal_2013_3_99118"
			"harel_2013_3_153"
		])

	it "needs to have noyarot ereh shirim teudot hov mishariyot",->
		asyncSpecWait()		
		findTab("ניירות ערך סחירים","תעודות חוב מסחריות",[
			"Migdal_2013_3_579"
			"Migdal_2013_3_99118"
			"harel_2013_3_153"
		])
			
	it "needs to have noyarot ereh shirim agah konzerni",->
		asyncSpecWait()
		findTab("ניירות ערך סחירים",'"אג""ח קונצרני"',[
			"Migdal_2013_3_414"
			"Migdal_2013_3_579"
			"Migdal_2013_3_99118"
		])

	it "needs to have noyarot ereh shirim menayot",->
		asyncSpecWait()
		findTab("ניירות ערך סחירים",'מניות',[
			"Migdal_2013_3_414"
			"Migdal_2013_3_579"
			"Migdal_2013_3_99118"
		])

	it "needs to have noyarot ereh shirim teudot sal",->
		asyncSpecWait()
		findTab("ניירות ערך סחירים",'תעודות סל',[
			"Migdal_2013_3_414"
			"Migdal_2013_3_579"
			"Migdal_2013_3_99118"
		])

	it "needs to have noyarot ereh shirim kranot neemanut",->
		asyncSpecWait()
		findTab("ניירות ערך סחירים",'קרנות נאמנות',[
			"Migdal_2013_3_414"
			"Migdal_2013_3_579"
			"Migdal_2013_3_99118"
		])

	it "needs to have noyarot ereh shirim kitvei optziya",->
		asyncSpecWait()
		findTab("ניירות ערך סחירים",'כתבי אופציה',[
			"Migdal_2013_3_414"
			"Migdal_2013_3_579"
			"Migdal_2013_3_99118"
		])

	it "needs to have noyarot ereh LO shirim teudot hithayvut mimshaltiyot",->
		asyncSpecWait()
		findTab("ניירות ערך לא סחירים",'תעודות התחייבות ממשלתיות',[
			"Migdal_2013_3_414"
			"Migdal_2013_3_579"
		])

	it "needs to have noyarot ereh LO shirim agah konzerni",->
		asyncSpecWait()
		findTab("ניירות ערך לא סחירים",'"אג""ח קונצרני"',[
			"Migdal_2013_3_414"
			"Migdal_2013_3_579"
			"Migdal_2013_3_99118"
		])

	it "needs to have noyarot ereh LO shirim menayot",->
		asyncSpecWait()
		findTab("ניירות ערך לא סחירים",'מניות',[
			"Migdal_2013_3_99118"
		])

	it "needs to have noyarot ereh LO shirim kranot hashkaa",->
		asyncSpecWait()
		findTab("ניירות ערך לא סחירים",'קרנות השקעה',[
			"Migdal_2013_3_414"
			"Migdal_2013_3_579"
			"Migdal_2013_3_99118"
		])

	it "needs to have noyarot ereh LO shirim kitvei optziya",->
		asyncSpecWait()
		findTab("ניירות ערך לא סחירים",'כתבי אופציה',[
			"Migdal_2013_3_414"
			"Migdal_2013_3_579"
			"Migdal_2013_3_99118"
		])

	it "needs to have noyarot ereh LO shirim optiyot",->
		asyncSpecWait()
		findTab("ניירות ערך לא סחירים",'אופציות',[
			"Migdal_2013_3_579"
			"Migdal_2013_3_99118"
		])

	it "needs to have noyarot ereh LO shirim hozim atidiim",->
		asyncSpecWait()
		findTab("ניירות ערך לא סחירים",'חוזים עתידיים',[
			"Migdal_2013_3_414"
			"Migdal_2013_3_579"
			"Migdal_2013_3_99118"
		])

	it "needs to have halvaot",->
		asyncSpecWait()
		findTab("הלוואות",'',[
			"Migdal_2013_3_414"
			"Migdal_2013_3_579"
			"Migdal_2013_3_99118"
		])

	it "needs to have pikdonot",->
		asyncSpecWait()
		findTab("פקדונות",'',[
			"Migdal_2013_3_579"
			"Migdal_2013_3_99118"
		])

	it "needs to have zhuyot mekarkeyin",->
		asyncSpecWait()
		findTab("זכויות מקרקעין",'',[
			"Migdal_2013_3_414"
			"Migdal_2013_3_579"
			"Migdal_2013_3_99118"
		])

	it "needs to have hashkaot aherot",->
		asyncSpecWait()
		findTab("השקעות אחרות",'',[
			
		])


findTab = (instrumentType,instrumentSubType, files)->
	if (files.length == 0)
		asyncSpecDone()
	else 
		f = files.shift()
		Helpers.parseXLSX f,(pXlsx)->
			expect(pXlsx.some((r)-> Helpers.resolveIdx(instrumentType,instrumentSubType) == r.idx )).toEqual(true)
			findTab(instrumentType,instrumentSubType, files)
			


