var MetaTable = require('./common/MetaTable');
var request = require('request');

exports.validate = function(headers,data,tabIndex) {
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


	var tabData = parseTabSpecificData(tabIndex, headers, data);

	return tabData.filter(function(l){
		return (
			!isLineEmpty(l)
		)
	});

}



var writeToCsv = function(managingBody, fund, year, quarter, tabIndex, instrument, instrumentSub, tabData,headers){
	var DB =  require('./db');
	var filename = "./tmp/" + [ managingBody, fund, year, quarter].join("_") + ".csv";
	DB.csv.write(filename, headers,managingBody, fund, year, quarter, instrument, instrumentSub, tabData);
}

var debugData = function(data){
	console.log("data debug","\n", tabData.map(function(l){ return l.join(",") }));
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

var isEmpty = function(value){
	return !isNotEmpty(value);
}

var isNotEmpty = function(value){
	return value != null && value != undefined && value != "";
}

var isNotNumber = function(value){
	return !isNumber(value);
}

var isNumber = function(value){
	return value != null && isNaN(parseFloat(value)) == false;
}

var cleanString = function(input){
	return input.trim().replace(/,/g,"-")
			.replace(/\([0-9]+\)/g,'')
			.replace(/[$%\r\n]/g,'')
			.replace(/^"/g,'')
			.replace(/"$/g,'')
			.replace(/([^"])"([^"])/gm,'$1""$2');
}

var cleanNumber = function(input){
	if (!input) 
		return input;
	
	var _input = input.replace(/([^]+?)-/g,"$1");
	if (isNaN(parseFloat(_input))) {
		console.log("had to zero string value which was:" + input);
		return 0;
	}
	else
		return parseFloat(_input);
}

var isContaining = function(input,word){
	return input && input.indexOf(word) >= 0;
}

var normalizeCurrency = function(input){
	var _input = cleanString(input);


	switch(_input){
		case 'ין':					return 'JPY';
		case 'כתר נורבגי':			return 'NOK';
		case 'פזו מקסיקני':			return 'MXP';
		case 'אירו': 				return 'EUR';
		case 'דולר אוסטרלי': 		return 'USD';
		case 'דולר קנדי': 			return 'CAD';
		case 'יואן סיני': 			return 'CNY';
		case 'יין': 				return 'JPY';
		case 'כתר דני': 			return 'DKK';
		case 'כתר שוודי': 			return 'SEK';
		case '₪': 					return 'NIS';
		case 'שקל': 				return 'NIS';
		case 'אירו 1': 				return 'EUR';
		case 'דולר': 				return 'USD';
		case 'דולר  דנאל': 			return 'USD';
		case 'דולר ארה"ב': 			return 'USD';
		case 'דולר הונג קונג': 		return 'HKD';
		case 'דולר הונג קונג יציג':	return 'HKD';
		case 'יורו': 				return 'EUR';
		case 'יורו דנאל': 			return 'EUR';
		case 'ין יפני דנאל': 		return 'JPY';
		case 'לי"שט': 				return 'GBP';
		case 'פרוינט הונגרי': 		return 'HUF';
		case 'פרנק שוויצרי': 		return 'CHF';
		case 'פרנק שוויצרי':		return 'CHF';
		case 'פרנק שוויצרי דנאל': 	return 'CHF';
		case 'פרנק שוצרי': 			return 'CHF';
		case 'ריאל ברזיל דנאל': 	return 'BRL';
		case 'שטרלינג': 			return 'GBP';
		case 'שטרלינג  דנאל': 		return 'GBP';
		case 'שקל חדש': 			return 'NIS';
		case 'אוסטרלי': 			return 'AUD';
		case 'קנדי': 				return 'CAD';
		case 'דולר ניו זילנד': 		return 'NZD';
		case 'דולר סינגפור': 		return 'SGD';
		case 'יין יפני': 			return 'JPY';
		case 'ין יפני': 			return 'JPY';
		case 'כת.נורב': 			return 'NOK';
		case 'כתר שבדי': 			return 'NOK';
		case 'לי"ש': 				return 'GBP';
		case 'לירה טורקית': 		return 'TRY';
		case 'ליש"ט': 				return 'GBP';
		case 'פר"ש': 				return 'CHF';
		case 'פרנק שויצרי': 		return 'CHF';
		case 'ריאל ברזילאי': 		return 'BRL';
		case 'רנד': 				return 'ZAR';
		case 'ILS': 				return 'NIS';
			default: return _input;
	}
}

var normalizeIndustry = function(input){
	var _input = cleanString(input);
	switch(_input){
		case 'Utilities (5510)': 				return 'Utilities';
		case 'Insurance': 						return 'ביטוח';
		case 'Insurance (4030)': 				return 'ביטוח';
		case 'Banks': 							return 'בנקים';
		case 'Alternative Investment': 			return 'השקעות אלטרנטיביות';
		case 'Semiconductors & Semiconductor':	return 'מוליכים למחצה';
		case 'Food': 							return 'מזון';
		case 'Food Beverage & Tobacco': 		return 'מזון וטבק';
		case 'Real Estate': 					return 'נדל"ן ובינוי';
		case 'Real Estate (4040)': 				return 'נדל"ן ובינוי';
		case 'Forest Products&Paper': 			return 'עץ ומוצריו';
		case 'שירותים פיננסים': 				return 'שירותים פיננסיים';
		case 'שרותים פיננסיים': 				return 'שירותים פיננסיים';
		case 'Information Technology':			return 'שרותי מידע';
		case 'Pharmaceuticals': 				return 'תעשיה-פארמה';
		case 'Media': 							return 'תקשורת ומדיה';
		default: return _input;
	}
}

var parseDate = function(input){
	var _input = cleanString(input);
	var daysSince1900 = 25567;
	var maginNumber = 2; // seems that the days figure I found seems to be 2 days from target.. hope this doesnt cause trouble *holds fingers
	var zDate = new Date( (parseInt(_input) - daysSince1900 -maginNumber) * 24 * 60 * 60 * 1000 );
	return zDate.toJSON();
}


/*
	Per sheet functions
*/


var shumNehaseiHakeren = function(headers,dataLines){
	var enHeaders = headers.map(function(h){return h.columnName});
	return dataLines.filter(function(l){
		return (
			isNotEmpty(l[ enHeaders.indexOf("fair_value") ])
			&& isNumber(l[ enHeaders.indexOf("fair_value") ])
			&& isNotEmpty(l[ enHeaders.indexOf("instrument_symbol") ])
		)
	}).map(function(l){
		return l.map(function(c,i){ return normalizeValues(enHeaders[i],c) });
	})
}

var mezumanim = function(headers, dataLines){
	var enHeaders = headers.map(function(h){return h.columnName});

	return dataLines.filter(function(l){
		return (
			(isContaining( l[ enHeaders.indexOf("instrument_symbol") ], "יתרות" ) == false &&
				isContaining( l[ enHeaders.indexOf("instrument_symbol") ], "פח\"ק/פר\"י" ) == false)
			&& ((isNotEmpty(l[ enHeaders.indexOf("rating") ])
				&& l[ enHeaders.indexOf("rating") ] != 0)
				|| (isNotEmpty(l[ enHeaders.indexOf("rating_agency") ]) 
				&& l[ enHeaders.indexOf("rating_agency") ] != 0)
				|| (isNotEmpty(l[ enHeaders.indexOf("currency") ]) 
				&& l[ enHeaders.indexOf("currency") ] != 0))
		)
	}).map(function(l){
		return l.map(function(c,i){ return normalizeValues(enHeaders[i],c) });
	})

}

var teudatHihayvutMimshalti = function(headers, dataLines){
	var enHeaders = headers.map(function(h){return h.columnName});
	return dataLines.filter(function(l){
		return (
			isNumber(l[ enHeaders.indexOf("rate") ])
			&& isNotEmpty(l[ enHeaders.indexOf("par_value") ])
			&& l[ enHeaders.indexOf("par_value") ] != 0
			&& isNotEmpty(l[ enHeaders.indexOf("rate") ])
			&& l[ enHeaders.indexOf("rate") ] != 0
			&& isNumber(l[ enHeaders.indexOf("rate") ])
		);
	}).map(function(l){
		return l.map(function(c,i){ return normalizeValues(enHeaders[i],c) });
	});
}

var taudatHovMisharit = function(headers, dataLines){
	var enHeaders = headers.map(function(h){return h.columnName});
	return dataLines.filter(function(l){
		return (
			isNumber(l[ enHeaders.indexOf("par_value") ])
			&& isNotEmpty(l[ enHeaders.indexOf("par_value") ])
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
			isNumber(l[ enHeaders.indexOf("par_value") ])
			&& (
                                isEmpty(l[ enHeaders.indexOf('market_cap') ])
                                        || ( isNotEmpty(l[ enHeaders.indexOf('market_cap') ]) && isNumber(l[ enHeaders.indexOf('market_cap') ]) )
                        )
			&& isNotEmpty(l[ enHeaders.indexOf("par_value") ])
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
			isNumber(l[ enHeaders.indexOf("par_value") ])
			&& isNotEmpty(l[ enHeaders.indexOf("par_value") ])
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
			isNumber(l[ enHeaders.indexOf("par_value") ])
			&& isNotEmpty(l[ enHeaders.indexOf("par_value") ])
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
			isNumber(l[ enHeaders.indexOf("par_value") ])
			&& isNotEmpty(l[ enHeaders.indexOf("par_value") ])
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
			isNumber(l[ enHeaders.indexOf("par_value") ])
			&& isNotEmpty(l[ enHeaders.indexOf("par_value") ])
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
			isNumber(l[ enHeaders.indexOf("par_value") ])
			&& isNotEmpty(l[ enHeaders.indexOf("par_value") ])
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
			isNumber(l[ enHeaders.indexOf("par_value") ])
			&& isNotEmpty(l[ enHeaders.indexOf("par_value") ])
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
			isNumber(l[ enHeaders.indexOf("par_value") ])
			&& isNotEmpty(l[ enHeaders.indexOf("par_value") ])
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
			isNumber(l[ enHeaders.indexOf("par_value") ])
			&& isNotEmpty(l[ enHeaders.indexOf("par_value") ])
			&& l[ enHeaders.indexOf("par_value") ] != 0
			&& isNotEmpty(l[ enHeaders.indexOf("rate") ])
			&& l[ enHeaders.indexOf("rate") ] != 0
			&& isNumber(l[ enHeaders.indexOf("rate") ])
		);
	}).map(function(l){
		return l.map(function(c,i){ return normalizeValues(enHeaders[i],c) });
	});
}

var taudatHovMisharitLoSahir = function(headers, dataLines){
	var enHeaders = headers.map(function(h){return h.columnName});
	return dataLines.filter(function(l){
		return (
			isNumber(l[ enHeaders.indexOf("par_value") ])
			&& isNotEmpty(l[ enHeaders.indexOf("par_value") ])
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
			isNumber(l[ enHeaders.indexOf("par_value") ])
			&& (
                                isEmpty(l[ enHeaders.indexOf('market_cap') ])
					|| ( isNotEmpty(l[ enHeaders.indexOf('market_cap') ]) && isNumber(l[ enHeaders.indexOf('market_cap') ]) )
                        )
			&& isNotEmpty(l[ enHeaders.indexOf("par_value") ])
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
			isNumber(l[ enHeaders.indexOf("par_value") ])
			&& isNotEmpty(l[ enHeaders.indexOf("par_value") ])
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
			isNumber(l[ enHeaders.indexOf("par_value") ])
			&& isNotEmpty(l[ enHeaders.indexOf("par_value") ])
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
			isNumber(l[ enHeaders.indexOf("par_value") ])
			&& isNotEmpty(l[ enHeaders.indexOf("par_value") ])
			&& l[ enHeaders.indexOf("par_value") ] != 0
			&& isNotEmpty(l[ enHeaders.indexOf("rate") ])
		);
	}).map(function(l){
		return l.map(function(c,i){ return normalizeValues(enHeaders[i],c) });
	});
}

var opttziyotLoSahir = function(headers, dataLines){
	var enHeaders = headers.map(function(h){return h.columnName});
	return dataLines.filter(function(l){
		return (
			isNumber(l[ enHeaders.indexOf("par_value") ])
			&& isNotEmpty(l[ enHeaders.indexOf("par_value") ])
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
			isNumber(l[ enHeaders.indexOf("par_value") ])
			&& isNotEmpty(l[ enHeaders.indexOf("par_value") ])
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
			isNumber(l[ enHeaders.indexOf("par_value") ])
			&& isNotEmpty(l[ enHeaders.indexOf("par_value") ])
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
			isNotEmpty(l[ enHeaders.indexOf("instrument_id") ])
			&& l[ enHeaders.indexOf("instrument_id") ] != 0
			&& ( (isNotEmpty(l[ enHeaders.indexOf("yield") ])
					&& isNumber(l[ enHeaders.indexOf("yield") ]))
				|| (!isNotEmpty(l[ enHeaders.indexOf("yield") ]))
			)
			&& isNumber(l[ enHeaders.indexOf("fair_value") ])
			&& isNotEmpty(l[ enHeaders.indexOf("fair_value") ])
			&& l[ enHeaders.indexOf("fair_value") ] != 0
		);
	}).map(function(l){
		return l.map(function(c,i){ return normalizeValues(enHeaders[i],c) });
	});
}

var pikdonot = function(headers, dataLines){
	var enHeaders = headers.map(function(h){return h.columnName});
	return dataLines.filter(function(l){
		return (
			isNumber(l[ enHeaders.indexOf("par_value") ])
			&& isNotEmpty(l[ enHeaders.indexOf("par_value") ])
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
			isNotEmpty(l[ enHeaders.indexOf("fair_value") ])
			&& isNumber(l[ enHeaders.indexOf("fair_value") ])
			&& l[ enHeaders.indexOf("fair_value") ] != 0	
			&& l[ enHeaders.indexOf("fair_value") ] > 0.1
			&& isNotEmpty(l[ enHeaders.indexOf("type_of_asset") ])
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
		case 'instrument_symbol': 	return cleanString(value);
		case 'instrument_id': 		return cleanString(value); //?????
		case 'underlying_asset': 	return cleanString(value);
		case 'instrument_type': 	return cleanString(value);
		case 'instrument_sub_type': return cleanString(value);
		case 'industry': 			return cleanString(normalizeIndustry(value));
		case 'rating': 				return cleanString(value);
		case 'rating_agency': 		return cleanString(value);
		case 'date_of_purchase': 	return parseDate(value);
		case 'average_of_duration': return cleanNumber(cleanString(value));
		case 'currency': 			return cleanString(normalizeCurrency(value));
  		case 'intrest_rate': 		return cleanNumber(cleanString(value));
		case 'yield': 				return cleanNumber(cleanString(value));
		case 'par_value': 			return cleanNumber(cleanString(value));
		case 'rate': 				return cleanNumber(cleanString(value));
		case 'market_cap': 			return cleanNumber(cleanString(value));
		case 'fair_value': 			return cleanNumber(cleanString(value));
		case 'rate_of_ipo': 		return cleanNumber(cleanString(value));
		case 'rate_of_fund': 		return cleanNumber(cleanString(value));
		case 'date_of_revaluation': return parseDate(value);
		case 'type_of_asset': 		return cleanString(value);
		case 'tmp_name': 			return cleanString(value);
		default:
			throw new Error("Unexpected column header value given: \"" + enName + "\"")
	}
}
