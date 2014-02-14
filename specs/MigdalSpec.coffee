genericImporter = require '../genericImporter'
mt = require('../common/MetaTable').getMetaTable()


describe "ParseXML Spec",->

	# make jasmine wait 50 seconds before timing out..
	jasmine.asyncSpecWait.timeout = 50000

	it "needs to have mezumanim", ->
		asyncSpecWait()
		findTab("מזומנים","",[
			Migdal_2013_3_414
		])

	it "needs to have noyarot ereh shirim teudot hithayvot mimshaltiyot",->
		asyncSpecWait()		
		findTab("ניירות ערך סחירים","תעודות התחייבות ממשלתיות",[
			Migdal_2013_3_414
		])
			
	it "needs to have noyarot ereh shirim agah konzerni",->
		asyncSpecWait()
		findTab("ניירות ערך סחירים",'"אג""ח קונצרני"',[
			Migdal_2013_3_414
		])

	it "needs to have noyarot ereh shirim menayot",->
		asyncSpecWait()
		findTab("ניירות ערך סחירים",'מניות',[
			Migdal_2013_3_414
		])

	it "needs to have noyarot ereh shirim teudot sal",->
		asyncSpecWait()
		findTab("ניירות ערך סחירים",'תעודות סל',[
			Migdal_2013_3_414
		])

	it "needs to have noyarot ereh shirim kranot neemanut",->
		asyncSpecWait()
		findTab("ניירות ערך סחירים",'קרנות נאמנות',[
			Migdal_2013_3_414
		])

	it "needs to have noyarot ereh shirim kitvei optziya",->
		asyncSpecWait()
		findTab("ניירות ערך סחירים",'כתבי אופציה',[
			Migdal_2013_3_414
		])

	it "needs to have noyarot ereh LO shirim teudot hithayvut mimshaltiyot",->
		asyncSpecWait()
		findTab("ניירות ערך לא סחירים",'תעודות התחייבות ממשלתיות',[
			Migdal_2013_3_414
		])

	it "needs to have noyarot ereh LO shirim agah konzerni",->
		asyncSpecWait()
		findTab("ניירות ערך לא סחירים",'"אג""ח קונצרני"',[
			Migdal_2013_3_414
		])

	it "needs to have noyarot ereh LO shirim menayot",->
		asyncSpecWait()
		findTab("ניירות ערך לא סחירים",'מניות',[
			
		])

	it "needs to have noyarot ereh LO shirim kranot hashkaa",->
		asyncSpecWait()
		findTab("ניירות ערך לא סחירים",'קרנות השקעה',[
			Migdal_2013_3_414
		])

	it "needs to have noyarot ereh LO shirim kitvei optziya",->
		asyncSpecWait()
		findTab("ניירות ערך לא סחירים",'כתבי אופציה',[
			Migdal_2013_3_414
		])

	it "needs to have noyarot ereh LO shirim optiyot",->
		asyncSpecWait()
		findTab("ניירות ערך לא סחירים",'אופציות',[
			
		])

	it "needs to have noyarot ereh LO shirim hozim atidiim",->
		asyncSpecWait()
		findTab("ניירות ערך לא סחירים",'חוזים עתידיים',[
			Migdal_2013_3_414
		])

	it "needs to have halvaot",->
		asyncSpecWait()
		findTab("הלוואות",'',[
			Migdal_2013_3_414
		])

	it "needs to have pikdonot",->
		asyncSpecWait()
		findTab("פקדונות",'',[
			
		])

	it "needs to have zhuyot mekarkeyin",->
		asyncSpecWait()
		findTab("זכויות מקרקעין",'',[
			Migdal_2013_3_414
		])

	it "needs to have hashkaot aherot",->
		asyncSpecWait()
		findTab("השקעות אחרות",'',[
			
		])


Migdal_2013_3_414 = __dirname + "/assets/Migdal_2013_3_414.xlsx"

resolveIdx = (instrumentType,instrumentSubType)->
	for it, x in mt.instrumentTypes
		if it == instrumentType and mt.instrumentSubTypes[x] == instrumentSubType
			return x
	throw "could not find idx for #{instrumentType} #{instrumentSubType}"

findTab = (instrumentType,instrumentSubType, files)->
	if (files.length == 0)
		asyncSpecDone()
	else 
		f = files.shift()
		loadParsedXML f, (pxml)->
			expect(pxml.some((r)-> resolveIdx(instrumentType,instrumentSubType) == r.idx )).toEqual(true)
			findTab(instrumentType,instrumentSubType, files)


parsedXMLCache = {}
loadParsedXML = (filename, callback)->
	if parsedXMLCache[filename] then callback(parsedXMLCache[filename])
	else
		genericImporter.parseXls filename,"Migdal","2013","3","414", (result)->
			parsedXMLCache[filename] = result
			loadParsedXML(filename, callback)	
