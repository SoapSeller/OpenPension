file = require('fs').readFileSync("./files.csv").toString()

xlsLines = file.split("\n").map((l)-> l.split(",")).filter((l)->RegExp("/.*xls").test(l[5]))

q1lines = xlsLines.map((l)->[l[3],l[5]])

console.log(q1lines)

