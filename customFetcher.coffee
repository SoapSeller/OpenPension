URL = require("url")
http = require("http")
https = require("https")
fs = require("fs")
cp = require("child_process")

file = require('fs').readFileSync("./files_data.csv").toString()

migdalFiles = file.split("\n").map((l)-> l.split(",")).filter((l)-> l[2] == '"מגדל אחזקות ביטוח ופיננסים בע""מ"' )
outDir = "fetching/"
concur = 0

fetchRec = (recMigFiles)->
	if recMigFiles.length == 0 then return
	hasCalled = false
	if concur < 2
		concur++
		hasCalled = true
		fetchRec(recMigFiles[1..])
	console.log "parsing next line, left:", recMigFiles.length

	line = recMigFiles[0]
	q312 = line[7]
	q113 = line[8]
	q213 = line[9]
	q313 = line[10]
	monkey = line[3]

	qDone = 4

	updateDone = ->
		qDone -= 1
		if not hasCalled and qDone == 0 then fetchRec(recMigFiles[1..])

	convertFile(line, q312,2012,3, "Migdal", monkey,updateDone)
	convertFile(line, q113,2013,1, "Migdal", monkey,updateDone)
	convertFile(line, q213,2013,2, "Migdal", monkey,updateDone)
	convertFile(line, q313,2013,3, "Migdal", monkey,updateDone)


convertFile = (line, fileUrl, year, q, body, monkey, convertDone)->

	if not fileUrl then return convertDone()

	url = URL.parse(fileUrl)
	console.log ">>>> converting:",year,q, fileUrl

	isHttps = url.protocol == "https:"
	options = {
		hostname: url.hostname,
		port: url.port ?= ( if isHttps then 443 else 80 )
		path: url.path,
		method: 'GET',
		rejectUnauthorized: false
	}

	baseName = outDir +  [ body,year,q,monkey ].join("_")
	filename = baseName + ".xls"

	stream = fs.createWriteStream(filename, { flags: 'w+', encoding: "binary", mode: 0o666 })

	req = (if isHttps then https else http).request options, (res)->
		res.on 'data', (chunk)-> stream.write(chunk)

		res.on 'end', ->
			stream.end()
			console.log "finished fetching file #{filename}"
			convertXlsXlsx filename, ()->
				require("child_process").exec "node index import -f #{filename}x -y #{year} -q #{q} -b #{body} -m #{monkey} ", ()->
					convertDone()


	req.on 'error', (e)->
		console.log  "problem with request(#{fileUrl}): #{e.message}", options
		convertDone()

	req.end()

convertXlsXlsx = (filename, cb)->
	cp.exec "file #{filename}", (err, stdout, stderr)->
		if not err and (stdout.toString().indexOf("CDF V2") != -1 or
					stdout.toString().indexOf("Composite Document File V2 Document") != -1)
			cmd = "ssconvert --export-type=Gnumeric_Excel:xlsx #{filename} #{filename}x"
			cp.exec cmd, (_err, _stdout, _stderr)->
				fs.unlink filename
				console.log "done converting to #{filename}x"
				cb()

		else
			console.log "error with file:#{filename}"



fetchRec(migdalFiles)