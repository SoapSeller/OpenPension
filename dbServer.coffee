express = require 'express'


DB =  require('./db');
# filename = "./tmp/" + managingBody + "_" + year + "_" + quarter + "_tab_" + tabIndex + ".csv";
# db = new DB.csv(filename)
# console.log("writing to file:" + filename)
db = DB.open()

pBuffer = []
persisting = false

persist = ->
	if not persisting
		persisting = true
		if (pBuffer.length > 0)
			item = pBuffer.shift()
			tableWriter = db.openTable(item.headers)
			tableWriter( 
				item.managingBody, 
				item.fund, 
				item.year, 
				item.quarter, 
				item.instrument, 
				item.instrumentSub, 
				item.tabData, 
				( -> persisting = false; persist() )
			)

app = express()

app.use(express.bodyParser())

app.all "*", (req,res,next)->
	next()

app.post '/save', (req, res)->
	console.log "received request"
	res.send()
	pBuffer.push({ headers: req.body.headers, managingBody:req.body.managingBody, fund:req.body.fund, year:req.body.year, quarter:req.body.quarter, instrument:req.body.instrument, instrumentSub:req.body.instrumentSub, tabData:req.body.tabData})
	persist()

app.listen("3001");