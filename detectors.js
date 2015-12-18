exports.cleanColumnHeaderStr = cleanColumnHeaderStr = function(inputStr){
	if (inputStr)
		return inputStr.replace(/\(.*\)/g,"").replace(/["'\n\r]/g,"").replace(/[ ]+/g," ").replace(/^.\. /,"").trim()
	else 
		return ""
}