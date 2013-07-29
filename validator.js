var MetaTable = require('./common/MetaTable');

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

		console.log(">!>!>!>!>!>!>!>","\n", tabData.map(function(l){ return l.join(" | ") }));
		// var DB =  require('./db');
		// var db = new DB.csv(managingBody + "_tab_" + tabIndex + ".csv");
		// var db = DB.open();
		// var tableWriter = db.openTable(headers);
		// tableWriter(managingBody, year, quarter, instrument, instrumentSub, data);
		
	} else {
		console.log(">!>!>!>!>!>!>!>", "no tab data found");
	}
	
	// if (tabIndex == 24) process.exit();

}

var parseTabSpecificData = function(tabIndex, headers, data){

	switch(tabIndex){
		case 0: return shumNehaseiHakeren(headers, data);
		case 1: return mezumanim(headers, data);
		case 2: return teudatHihayvutMimshalti(headers,data);
		case 3: return taudatHovMisharit(headers,data);
		case 4: return agahKontzerni(headers,data);
		case 5: return menayot(headers,data);
		case 6: return teudotSal(headers,data);
		case 7: return kranotNemanut(headers,data);
		case 8: return kitveiOptzia(headers,data);
		case 9: return opttziyot(headers,data);
		case 10: return hozimAtidiim(headers,data);
		case 11: return motzarimMuvnim(headers,data);
		case 12: return teudatHihayvutMimshaltiLoSahir(headers,data);
		case 13: return taudatHovMisharitLoSahir(headers,data);
		case 14: return agahKontzerniLoSahir(headers,data);
		case 15: return menayotLoSahir(headers,data);
		case 16: return kranotHashkaaLoSahir(headers, data);
		case 17: return kitveiOptziaLoSahir(headers, data);
		case 18: return opttziyotLoSahir(headers, data);
		case 19: return hozimAtidiimLoSahir(headers, data);
		case 20: return motzarimMuvnimLoSahir(headers, data);
		case 21: return halvaot(headers, data);
		case 22: return pikdonot(headers, data);
		case 23: return zhuyotMekarkein(headers, data);
		case 24: return haskaotAherot(headers, data);
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


var shumNehaseiHakeren = function(headers,lines){
	var symbolIndex = headers.map(function(h){return h.columnName}).indexOf("instrument_symbol");
	
	lines.forEach(function(l){
		// console.log(l[symbolIndex]);
	})
}



var currencyMap = {
	"₪" : "NIS",
	"שקל" : "NIS"
}

var cleanCurrency = function(input){
	if (currencyMap[input])
		return currencyMap[input];
	else 
		return input;
}

var mezumanim = function(headers, dataLines){
	var enHeaders = headers.map(function(h){return h.columnName});
	return dataLines.filter(function(l){
		return (
			isNotEmpty(l[ enHeaders.indexOf("currency") ])
			&& l[ enHeaders.indexOf("currency") ] != 0
		)
	}).map(function(l){
		return l.map(function(c,i){ return normalizeValues(enHeaders[i],c) });
	})

}


var teudatHihayvutMimshalti = function(headers, dataLines){
	var enHeaders = headers.map(function(h){return h.columnName});
	return dataLines.filter(function(l){
		return (
			isNotEmpty(l[ enHeaders.indexOf("par_value") ])
			&& l[ enHeaders.indexOf("par_value") ] != 0
			&& isNotEmpty(l[ enHeaders.indexOf("rate") ])
			&& l[ enHeaders.indexOf("rate") ] != 0
		);
	}).map(function(l){
		return l.map(function(c,i){ return normalizeValues(enHeaders[i],c) });
	})
}

var taudatHovMisharit = function(headers, dataLines){
	var enHeaders = headers.map(function(h){return h.columnName});
	return dataLines.filter(function(l){
		return (
			isNotEmpty(l[ enHeaders.indexOf("par_value") ])
			&& l[ enHeaders.indexOf("par_value") ] != 0
			&& isNotEmpty(l[ enHeaders.indexOf("rate") ])
			&& l[ enHeaders.indexOf("rate") ] != 0
		);
	}).map(function(l){
		return l.map(function(c,i){ return normalizeValues(enHeaders[i],c) });
	});
}

var agahKontzerni = function(headers, dataLines){
	var enHeaders = headers.map(function(h){return h.columnName});
	return dataLines.filter(function(l){
		return (
			isNotEmpty(l[ enHeaders.indexOf("par_value") ])
			&& l[ enHeaders.indexOf("par_value") ] != 0
			&& isNotEmpty(l[ enHeaders.indexOf("rate") ])
			&& l[ enHeaders.indexOf("rate") ] != 0
		);
	}).map(function(l){
		return l.map(function(c,i){ return normalizeValues(enHeaders[i],c) });
	});
}

var menayot = function(headers, dataLines){
	var enHeaders = headers.map(function(h){return h.columnName});
	return dataLines.filter(function(l){
		return (
			isNotEmpty(l[ enHeaders.indexOf("par_value") ])
			&& l[ enHeaders.indexOf("par_value") ] != 0
			&& isNotEmpty(l[ enHeaders.indexOf("rate") ])
			&& l[ enHeaders.indexOf("rate") ] != 0
		);
	}).map(function(l){
		return l.map(function(c,i){ return normalizeValues(enHeaders[i],c) });
	});
}

var teudotSal = function(headers, dataLines){
	var enHeaders = headers.map(function(h){return h.columnName});
	return dataLines.filter(function(l){
		return (
			isNotEmpty(l[ enHeaders.indexOf("par_value") ])
			&& l[ enHeaders.indexOf("par_value") ] != 0
			&& isNotEmpty(l[ enHeaders.indexOf("rate") ])
			&& l[ enHeaders.indexOf("rate") ] != 0
		);
	}).map(function(l){
		return l.map(function(c,i){ return normalizeValues(enHeaders[i],c) });
	});
}

var kranotNemanut = function(headers, dataLines){
	var enHeaders = headers.map(function(h){return h.columnName});
	return dataLines.filter(function(l){
		return (
			isNotEmpty(l[ enHeaders.indexOf("par_value") ])
			&& l[ enHeaders.indexOf("par_value") ] != 0
			&& isNotEmpty(l[ enHeaders.indexOf("rate") ])
			&& l[ enHeaders.indexOf("rate") ] != 0
		);
	}).map(function(l){
		return l.map(function(c,i){ return normalizeValues(enHeaders[i],c) });
	});
}

var kitveiOptzia = function(headers, dataLines){
	var enHeaders = headers.map(function(h){return h.columnName});
	return dataLines.filter(function(l){
		return (
			isNotEmpty(l[ enHeaders.indexOf("par_value") ])
			&& l[ enHeaders.indexOf("par_value") ] != 0
			&& isNotEmpty(l[ enHeaders.indexOf("rate") ])
			&& l[ enHeaders.indexOf("rate") ] != 0
		);
	}).map(function(l){
		return l.map(function(c,i){ return normalizeValues(enHeaders[i],c) });
	});
}

var opttziyot = function(headers, dataLines){
	var enHeaders = headers.map(function(h){return h.columnName});
	return dataLines.filter(function(l){
		return (
			isNotEmpty(l[ enHeaders.indexOf("par_value") ])
			&& l[ enHeaders.indexOf("par_value") ] != 0
			&& isNotEmpty(l[ enHeaders.indexOf("rate") ])
			&& l[ enHeaders.indexOf("rate") ] != 0
		);
	}).map(function(l){
		return l.map(function(c,i){ return normalizeValues(enHeaders[i],c) });
	});
}

var hozimAtidiim = function(headers, dataLines){
	var enHeaders = headers.map(function(h){return h.columnName});
	return dataLines.filter(function(l){
		return (
			isNotEmpty(l[ enHeaders.indexOf("par_value") ])
			&& l[ enHeaders.indexOf("par_value") ] != 0
			&& isNotEmpty(l[ enHeaders.indexOf("rate") ])
			&& l[ enHeaders.indexOf("rate") ] != 0
		);
	}).map(function(l){
		return l.map(function(c,i){ return normalizeValues(enHeaders[i],c) });
	});
}

var motzarimMuvnim = function(headers, dataLines){
	var enHeaders = headers.map(function(h){return h.columnName});
	return dataLines.filter(function(l){
		return (
			isNotEmpty(l[ enHeaders.indexOf("par_value") ])
			&& l[ enHeaders.indexOf("par_value") ] != 0
			&& isNotEmpty(l[ enHeaders.indexOf("rate") ])
			&& l[ enHeaders.indexOf("rate") ] != 0
		);
	}).map(function(l){
		return l.map(function(c,i){ return normalizeValues(enHeaders[i],c) });
	});
}

var teudatHihayvutMimshaltiLoSahir = function(headers, dataLines){
	var enHeaders = headers.map(function(h){return h.columnName});
	return dataLines.filter(function(l){
		return (
			isNotEmpty(l[ enHeaders.indexOf("par_value") ])
			&& l[ enHeaders.indexOf("par_value") ] != 0
			&& isNotEmpty(l[ enHeaders.indexOf("rate") ])
			&& l[ enHeaders.indexOf("rate") ] != 0
		);
	}).map(function(l){
		return l.map(function(c,i){ return normalizeValues(enHeaders[i],c) });
	});
}

var taudatHovMisharitLoSahir = function(headers, dataLines){
	var enHeaders = headers.map(function(h){return h.columnName});
	return dataLines.filter(function(l){
		return (
			isNotEmpty(l[ enHeaders.indexOf("par_value") ])
			&& l[ enHeaders.indexOf("par_value") ] != 0
			&& isNotEmpty(l[ enHeaders.indexOf("rate") ])
			&& l[ enHeaders.indexOf("rate") ] != 0
		);
	}).map(function(l){
		return l.map(function(c,i){ return normalizeValues(enHeaders[i],c) });
	});
}

var agahKontzerniLoSahir = function(headers, dataLines){
	var enHeaders = headers.map(function(h){return h.columnName});
	return dataLines.filter(function(l){
		return (
			isNotEmpty(l[ enHeaders.indexOf("par_value") ])
			&& l[ enHeaders.indexOf("par_value") ] != 0
			&& isNotEmpty(l[ enHeaders.indexOf("rate") ])
			&& l[ enHeaders.indexOf("rate") ] != 0
		);
	}).map(function(l){
		return l.map(function(c,i){ return normalizeValues(enHeaders[i],c) });
	});
}

var menayotLoSahir = function(headers, dataLines){
	var enHeaders = headers.map(function(h){return h.columnName});
	return dataLines.filter(function(l){
		return (
			isNotEmpty(l[ enHeaders.indexOf("par_value") ])
			&& l[ enHeaders.indexOf("par_value") ] != 0
			&& isNotEmpty(l[ enHeaders.indexOf("rate") ])
			&& l[ enHeaders.indexOf("rate") ] != 0
		);
	}).map(function(l){
		return l.map(function(c,i){ return normalizeValues(enHeaders[i],c) });
	});
}

var kranotHashkaaLoSahir = function(headers, dataLines){
	var enHeaders = headers.map(function(h){return h.columnName});
	return dataLines.filter(function(l){
		return (
			isNotEmpty(l[ enHeaders.indexOf("par_value") ])
			&& l[ enHeaders.indexOf("par_value") ] != 0
			&& isNotEmpty(l[ enHeaders.indexOf("rate") ])
			&& l[ enHeaders.indexOf("rate") ] != 0
		);
	}).map(function(l){
		return l.map(function(c,i){ return normalizeValues(enHeaders[i],c) });
	});
}

var kitveiOptziaLoSahir = function(headers, dataLines){
	var enHeaders = headers.map(function(h){return h.columnName});
	return dataLines.filter(function(l){
		return (
			isNotEmpty(l[ enHeaders.indexOf("par_value") ])
			&& l[ enHeaders.indexOf("par_value") ] != 0
			&& isNotEmpty(l[ enHeaders.indexOf("rate") ])
			&& l[ enHeaders.indexOf("rate") ] != 0
		);
	}).map(function(l){
		return l.map(function(c,i){ return normalizeValues(enHeaders[i],c) });
	});
}

var opttziyotLoSahir = function(headers, dataLines){
	var enHeaders = headers.map(function(h){return h.columnName});
	return dataLines.filter(function(l){
		return (
			isNotEmpty(l[ enHeaders.indexOf("par_value") ])
			&& l[ enHeaders.indexOf("par_value") ] != 0
			&& isNotEmpty(l[ enHeaders.indexOf("rate") ])
			&& l[ enHeaders.indexOf("rate") ] != 0
		);
	}).map(function(l){
		return l.map(function(c,i){ return normalizeValues(enHeaders[i],c) });
	});
}

var hozimAtidiimLoSahir = function(headers, dataLines){
	var enHeaders = headers.map(function(h){return h.columnName});
	return dataLines.filter(function(l){
		return (
			isNotEmpty(l[ enHeaders.indexOf("par_value") ])
			&& l[ enHeaders.indexOf("par_value") ] != 0
			&& isNotEmpty(l[ enHeaders.indexOf("rate") ])
			&& l[ enHeaders.indexOf("rate") ] != 0
		);
	}).map(function(l){
		return l.map(function(c,i){ return normalizeValues(enHeaders[i],c) });
	});
}

var motzarimMuvnimLoSahir = function(headers, dataLines){
	var enHeaders = headers.map(function(h){return h.columnName});
	return dataLines.filter(function(l){
		return (
			isNotEmpty(l[ enHeaders.indexOf("par_value") ])
			&& l[ enHeaders.indexOf("par_value") ] != 0
			&& isNotEmpty(l[ enHeaders.indexOf("rate") ])
			&& l[ enHeaders.indexOf("rate") ] != 0
		);
	}).map(function(l){
		return l.map(function(c,i){ return normalizeValues(enHeaders[i],c) });
	});
}

var halvaot = function(headers, dataLines){
	var enHeaders = headers.map(function(h){return h.columnName});
	return dataLines.filter(function(l){
		return (
			isNotEmpty(l[ enHeaders.indexOf("par_value") ])
			&& l[ enHeaders.indexOf("par_value") ] != 0
			&& isNotEmpty(l[ enHeaders.indexOf("rate") ])
			&& l[ enHeaders.indexOf("rate") ] != 0
		);
	}).map(function(l){
		return l.map(function(c,i){ return normalizeValues(enHeaders[i],c) });
	});
}

var pikdonot = function(headers, dataLines){
	var enHeaders = headers.map(function(h){return h.columnName});
	return dataLines.filter(function(l){
		return (
			isNotEmpty(l[ enHeaders.indexOf("par_value") ])
			&& l[ enHeaders.indexOf("par_value") ] != 0
			&& isNotEmpty(l[ enHeaders.indexOf("rate") ])
			&& l[ enHeaders.indexOf("rate") ] != 0
		);
	}).map(function(l){
		return l.map(function(c,i){ return normalizeValues(enHeaders[i],c) });
	});
}

var zhuyotMekarkein = function(headers, dataLines){
	var enHeaders = headers.map(function(h){return h.columnName});
	return dataLines.filter(function(l){
		return (
			isNotEmpty(l[ enHeaders.indexOf("par_value") ])
			&& l[ enHeaders.indexOf("par_value") ] != 0
		);
	}).map(function(l){
		return l.map(function(c,i){ return normalizeValues(enHeaders[i],c) });
	});
}

var haskaotAherot = function(headers, dataLines){
	var enHeaders = headers.map(function(h){return h.columnName});
	return dataLines.filter(function(l){
		return (
			isNotEmpty(l[ enHeaders.indexOf("rating_agency") ])
		);
	}).map(function(l){
		return l.map(function(c,i){ return normalizeValues(enHeaders[i],c) });
	});
}

var normalizeValues = function(enName, value){
	switch(enName){
		case 'instrument_symbol': 	return value;
		case 'instrument_id': 		return value; //?????
		case 'underlying_asset': 	return value;
		case 'industry': 			return value;
		case 'rating': 				return value;
		case 'rating_agency': 		return value;
		case 'date_of_purchase': 	return value;
		case 'average_of_duration': return value;
		case 'currency': 			return cleanCurrency(value);
  		case 'intrest_rate': 		return value;
		case 'yield': 				return value;
		case 'par_value': 			return value;
		case 'rate': 				return value;
		case 'market_cap': 			return value;
		case 'fair_value': 			return value;
		case 'rate_of_ipo': 		return value;
		case 'rate_of_fund': 		return value;
		case 'date_of_revaluation': return value;
		case 'type_of_asset': 		return value;
		default:
			throw new Error("Unexpected column header value given: \"" + c + "\"")
	}
}
