express = require 'express'


DB =  require('./db');
# filename = "./tmp/" + managingBody + "_" + year + "_" + quarter + "_tab_" + tabIndex + ".csv";
# db = new DB.csv(filename)
# console.log("writing to file:" + filename)
db = DB.open()


app = express()

app.use(express.bodyParser())

app.all "*", (req,res,next)->
	next()

app.post '/save', (req, res)->
	res.send()
	tableWriter = db.openTable(req.body.headers)
	tableWriter req.body.managingBody, req.body.fund, req.body.year, req.body.quarter, req.body.instrument, req.body.instrumentSub, req.body.tabData

app.listen("3001")