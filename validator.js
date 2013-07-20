var MetaTable = require('./MetaTable');

exports.validate = function(headers,data,managingBody,tabIndex,year,quarter) {
// managingBody; (string) 'Migdal' לדגמ
// tabIndex; (integer) the tab number in the managingBody xls sheet
// headers; (array of objects) [{columnName: 'instrument_id'}] 
//  
// data; (array of arrays - each of which has the same length as headers) [
// 				["instrument 1"],
// 				["instrument 2"] 
// 			]

	var metaTable = MetaTable.getMetaTable();

	var instrument = metaTable.instrumentTypes[tabIndex];
	var instrumentSub = metaTable.instrumentSubTypes[tabIndex];
	
	var cleanData = data.filter(function(l){
		return (
			!isLineEmpty(l)
		)
	});

	// console.log("en headers",headers);

	var tabData = parseTabSpecificData(tabIndex, headers, data);
	if ((tabData || []).length > 0){

		console.log(">!>!>!>!>!>!>!>","\n",tabData.map(function(l){ return l.join(" | ") }));
		// var DB =  require('./db');
		// var db = new DB.csv(managingBody + "_tab_" + tabIndex + ".csv");
		// var db = DB.open();
		// var tableWriter = db.openTable(headers);
		// tableWriter(managingBody, year, quarter, instrument, instrumentSub, data);
		
	}
	
	if (tabIndex == 2) process.exit();

}

var parseTabSpecificData = function(tabIndex, headers, data){

	switch(tabIndex){
		case 0: return shumNehaseiHakerenCleaner(headers, data);
		case 1: return mezumanim(headers, data);

	}
}

function removeSpecialChars(content, numColumns){
	for (var rowIndex = content.length - 1 ; rowIndex > -1; rowIndex--){
		var numColumns = content[rowIndex].length;
		for (var columnIndex = numColumns -1; columnIndex > -1; columnIndex--){
			var cellContent = content[rowIndex][columnIndex];
			content[rowIndex][columnIndex] = getCleanValue(cellContent);
		}
	}
}

function getCleanValue(value){
	// remove %$
	return value.replace("$", "").replace("%", "");
}

var isLineEmpty = function(line){
	if (line.filter(function(x){ return x != null && x != undefined && x != "" }).length > 0)
		return false;
	else
		return true;
}

var isNotEmpty = function(value){
	return value != null && value != undefined && value != ""
}

var removeRowsWithLittleData = function(data, headers){
	var goodData = data.filter(function(row){
		if (row.filter(function(x){return x != null && x != undefined && x != "" }).length < headers.length / 2)
			return false
		else return true
	});
	return goodData;
}

function removeBadLengthLines(content, numColumns)
{
	for (var i = content.length - 1 ; i > -1; i--){
		if (content[i].length !== numColumns){
			content.splice(i, 1);
			// console.log ('line ' + i + ' has ' + content[i].length + ' columns. expected ' + numColumns + '.');
		}
	}
}



function removeLinesWithoutInstrumentSymbol(content, headers){
	var instrumentSymbolIndex = getInstrumentSymbolIndex(headers);
	if (instrumentSymbolIndex == -1){
		console.log('missing instrument symbol in headers. ');
	}
	for (var rowIndex = content.length - 1 ; rowIndex > -1; rowIndex--){
		if (content[rowIndex][instrumentSymbolIndex] == ''){
			console.log('@@ removing: ' + content[rowIndex]);
			content.splice(rowIndex, 1);
		}
	}
}

function getInstrumentSymbolIndex(headers){
	var INSTRUMENT_SYMBOL = "instrument_symbol";
	for (var i=0; i < headers.length; i++){
		for (key in headers[i]){
			if (headers[i][key] == INSTRUMENT_SYMBOL){
				return i;
			}
		}
	}
	return -1;
}

function validateTypes(){
	
}

var schumNehasimNames = [
	"נכסים המוצגים לפי שווי הוגן",
	"מזומנים ושווי מזומנים",
	"ניירות ערך סחירים",
	"תעודות התחייבות ממשלתיות",
	"תעודות חוב מסחריות",
	"אג\"ח קונצרני",
	"מניות",
	"תעודות סל",
	"תעודות השתתפות בקרנות נאמנות",
	"כתבי אופציה",
	"אופציות",
	"חוזים עתידיים",
	"מוצרים מובנים",
	"ניירות ערך לא סחירים",
	"תעודות התחייבות ממשלתיות",
	"תעודות חוב מסחריות",
	"אג\"ח קונצרני",
	"מניות",
	"קרנות השקעה",
	"כתבי אופציה",
	"אופציות",
	"חוזים עתידיים",
	"מוצרים מובנים",
	"הלוואות",
	"פקדונות",
	"זכויות מקרקעין",
	"השקעות אחרות",
	"נכסים המוצגים לפי עלות מתואמת",
	"אג\"ח קונצרני סחיר",
	"אג\"ח קונצרני לא סחיר",
	"מסגרות אשראי מנוצלות ללווים"
]


var shumNehaseiHakerenCleaner = function(headers,lines){
	var symbolIndex = headers.map(function(h){return h.columnName}).indexOf("instrument_symbol");
	
	lines.forEach(function(l){
		console.log(l[symbolIndex]);
	})
}


var currencyMap = {
	"₪" : "NIS",
	"שקל" : "NIS"
}

var mezumanim = function(headers, dataLines){
	var enHeaders = headers.map(function(h){return h.columnName});
	// console.log(enHeaders);
	return dataLines.filter(function(l){
		return (
			isNotEmpty(l[ enHeaders.indexOf("currency") ])
			&& l[ enHeaders.indexOf("currency") ] != 0
		)
	}).map(function(l){
		return l.map(function(c,i){
			switch(enHeaders[i]){
				case 'rate_of_fund': 	return c;
				case 'market_cap': 		return c;
				case 'yield': 			return c;
				case 'intrest_rate': 	return c;
				case 'currency': 		
					if (currencyMap[c]) return currencyMap[c] 
						else return c;
				case 'rating_agency': 	return c;
				case 'rating': 			return c;
				case 'instrument_id': 	return c; // ????
				case 'instrument_symbol':return c;
				default:
					throw new Error("Unexpected column header value given: \"" + c + "\"")
			}
		})
	})

}