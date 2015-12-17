var MetaTable = require('./common/MetaTable');
var _ = require('underscore');
var logger = require('./logger')(module);

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
		if(	isLineEmpty(l) 	|| 
			_.intersection(l,
					["1","2","3","4","5","6","7","8","9","10","11","12"]
				).length > 3 ){

				logger.warn('skipping line:' + l);
				return false;
			}
			return true;
		});
	

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
	try { return (input || "").trim().replace(/,/g,"-")
			.replace(/\([0-9]+\)/g,'')
			.replace(/[$%\r\n]/g,'')
			.replace(/^"/g,'')
			.replace(/"$/g,'')
			.replace(/([^"])"([^"])/gm,'$1""$2');
	} catch(err) {
		console.log("failed with input",input);
		return "";
	}
}

var re = /^IL00([0-9]+)[0-9][^0-9].*/; 

var cleanInstrumentId = function(input){
	var out = re.exec(input);
	if (out)
		return out[0]
	else 
		return input
}

var cleanNumber = function(input){
	if (!input) 
		return input;

	var _input = parseFloat(input.replace(/,|`|'/g,"").replace(/([^]+?[^Ee])-/g,"$1"));
	
	if (isNaN(_input)) {
		logger.warn("Expecting number, found '" +input + "' returning 0");
		return "0";
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
		case '_פרנק שויצרי': 		return 'CHF';
		case 'דולר אוסטרלי': 		return 'AUD';
		case 'אוסטרלי': 			return 'AUD';
		case 'אוסטרליה-דולר':		return 'AUD';
		case 'אוסטרליה-דולר תקין':	return 'AUD';
		case 'אירו שיקוף':			return 'EUR';
		case 'אירופה-יורו':			return 'EUR';
		case 'בטחונות דולר':		return 'USD';
		case 'דולר  אוסטרליה':		return 'AUD';
		case 'דולר  הונגקונג':		return 'HKD';
		case 'דולר אוסטרלי דנאל':	return 'AUD';
		case 'דולר אוסטרלי עדכני':	return 'AUD';
		case 'דולר אוסטרלי שיקוף':	return 'AUD';
		case 'דולר ארה ב':			return 'USD';
		case 'דולר ארה~ב':			return 'USD';
		case 'דולר ארהב':			return 'USD';
		case 'דולר ארהב יציג':		return 'USD';
		case 'דולר ארהב שיקוף':		return 'USD';
		case 'דולר הונג-קונג':		return 'HKD';
		case 'דולר הונג-קונג יציג':	return 'HKD';
		case 'דולר הונג-קונג עדכני':return 'HKD';
		case 'דולר הונג קונג - תקין':return 'HKD';
		case 'דולר הונג קונג שיקוף':return 'HKD';
		case 'דולר חדש עדכני':		return 'USD';
		case 'דולר לאומי שוויץ':	return 'USD';
		case 'דולר מיוחד':			return 'USD';
		case 'דולר ניו-זילנד':		return 'NZD';
		case 'דולר ניו זילנדי':		return 'NZD';
		case 'דולר קנדי שיקוף':		return 'CAD';
		case 'זלוטי':				return 'PLN';
		case 'זלוטי פולני':			return 'PLN';
		case 'זלוטי פולני עדכני':	return 'PLN';
		case 'יורו יציג':			return 'EUR';
		case 'יורו לאומי שוויץ':	return 'EUR';
		case 'יין יפני- לאומי':		return 'JPY';
		case 'יין יפני - תקין':		return 'JPY';
		case 'יין יפני יובנק':		return 'JPY';
		case 'יין יפני יציג':		return 'JPY';
		case 'יין יפני שיקוף':		return 'JPY';
		case 'ין יפן YPJ  לעסקת פורוורד':return 'JPY';
		case 'ין יפני עדכני':		return 'JPY';
		case 'ין/100':				return 'JPY';
		case 'כתר   נורוגיה':		return 'NOK';
		case 'כתר דנמרק':			return 'DKK';
		case 'כתר נורבגי עדכני':	return 'NOK';
		case 'כתר נורבגי שיקוף':	return 'NOK';
		case 'כתר שבדי שיקוף':		return 'SEK';
		case 'לירה טורקית חדשה':	return 'TRY';
		case 'לירה סטרלינג':		return 'GBP';
		case 'לירה שטרלינג':		return 'GBP';
		case 'לירה שטרלינג יציג':	return 'GBP';
		case 'לירה שטרלינג תקין':	return 'GBP';
		case 'ליש':					return 'GBP';
		case 'לישט':				return 'GBP';
		case 'לישט - יציג':			return 'GBP';
		case 'לישט שיקוף':			return 'GBP';
		case 'ניו   זילנד דולר':	return 'NZD';
		case 'פזו מקסיקני חדש':		return 'MXN';
		case 'פזו צ\'יליאני':		return 'CLP';
		case 'פזו צ\'יליאני עדכני':	return 'CLP';
		case 'פזו צ יליאני':		return 'CLP';
		case 'פזטה מקסיקני':		return 'MXN';
		case 'פרנק שוויצרי עדכני':	return 'CHF';
		case 'פרנק שווצרי':			return 'CHF';
		case 'פרש':					return 'CHF';
		case 'קנדה- דולר':			return 'CAD';
		case 'קנדה-דולר':			return 'CAD';
		case 'קנדה-דולר תקין':		return 'CAD';
		case 'קנדי':				return 'CAD';
		case 'ריאל ברזיל':			return 'BRL';
		case 'ריאל ברזילאי  - בלל':	return 'BRL';
		case 'ריאל ברזילאי יציג':	return 'BRL';
		case 'ריאל ברזילאי תקין':	return 'BRL';
		case 'רנד ד.א':				return 'ZAR';
		case 'רנד דרא פ':			return 'ZAR';
		case 'רנד דראפ':			return 'ZAR';
		case 'ש\'ח':				return 'NIS';
		case 'שטרלינג עדכני':		return 'GBP';
		case 'שיקוף פרנק שויצרי':	return 'CHF';
			default: return _input;
	}
}

var normalizeRating = function(input){
	
	var _input = cleanString(input);

	if (_.isEmpty(input)) return input;

	input = input.toUpperCase();

    if (input == 'פנימי') return 'פנימי';
    else if (input == 'AAA') return 'AAA';
    else if (input == 'AA1') return 'AA+';
    else if (input == 'AA2') return 'AA';
    else if (input == 'AA3') return 'AA-';
    else if (input == 'A1') return 'A+';
    else if (input == 'A2') return 'A';
    else if (input == 'A3') return 'A-';
    else if (input == 'BAA1') return 'BBB+';
    else if (input == 'BAA2') return 'BBB';
    else if (input == 'BAA3') return 'BBB-';
    else if (input == 'BA1') return 'B+';
    else if (input == 'BA2') return 'B';
    else if (input == 'BA3') return 'B-';
    else if (input == 'CAA') return 'CCC+';
    else if (input == 'CAA2') return 'CCC';
    else if (input == 'CA') return 'CCC';
    else if (input == 'C') return 'CCC-';
    else if (input == 'RF') return 'AAA';
    else if (/.*N.*R.*/.test(input) ) return 'לא מדורג';
    else if (input == 'NR') return 'לא מדורג';
    else if (input == 'D') return 'D';
    else if (input == '+BBB') return 'BBB+';
    else if (input == '-AA') return 'AA-';
    else if (input == '+A') return 'A+';
    else if (input == '-A') return 'A-';
    else if (input == 'ללא דירוג') return 'לא מדורג';
    else if (/.*דורג.*/.test(input) ) return 'לא מדורג';
    else if (/.*דירוג.*/.test(input) ) return 'לא מדורג';

    return input;

//            WHEN ((((production.rating IS NULL) OR ((production.rating)::text ~~ '%0%'::text)) OR ((production.rating)::text = '-'::text)) AND (((production.instrument_sub_type)::text = ANY ((ARRAY['תעודות התחייבות ממשלתיות'::character varying, 'תעודות חוב מסחריות'::character varying, 'אג"ח קונצרני'::character varying])::text[])) OR ((production.instrument_type)::text = 'הלוואות'::text))) THEN ('לא דווח'::character varying(128))::text
  //          WHEN (((((production.rating)::text ~~ '%0%'::text) OR ((production.rating)::text = '-'::text)) AND ((production.instrument_sub_type IS NULL) OR ((production.instrument_sub_type)::text <> ALL ((ARRAY['תעודות התחייבות ממשלתיות'::character varying, 'תעודות חוב מסחריות'::character varying, 'אג"ח קונצרני'::character varying])::text[])))) AND (NOT ((production.instrument_type)::text = 'הלוואות'::text))) THEN NULL::text
    //        ELSE upper((production.rating)::text)
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
		var row = _.object(enHeaders,l);
		return l.map(function(c,i){ return normalizeValues(enHeaders[i],c, row) });
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
		var row = _.object(enHeaders,l);
		return l.map(function(c,i){ return normalizeValues(enHeaders[i],c, row) });
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
		var row = _.object(enHeaders,l);
		return l.map(function(c,i){ return normalizeValues(enHeaders[i],c, row) });
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
		var row = _.object(enHeaders,l);
		return l.map(function(c,i){ return normalizeValues(enHeaders[i],c, row) });
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
		var row = _.object(enHeaders,l);
		return l.map(function(c,i){ return normalizeValues(enHeaders[i],c, row) });
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
		var row = _.object(enHeaders,l);
		return l.map(function(c,i){ return normalizeValues(enHeaders[i],c, row) });
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
		var row = _.object(enHeaders,l);
		return l.map(function(c,i){ return normalizeValues(enHeaders[i],c, row) });
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
		var row = _.object(enHeaders,l);
		return l.map(function(c,i){ return normalizeValues(enHeaders[i],c, row) });
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
		var row = _.object(enHeaders,l);
		return l.map(function(c,i){ return normalizeValues(enHeaders[i],c, row) });
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
		var row = _.object(enHeaders,l);
		return l.map(function(c,i){ return normalizeValues(enHeaders[i],c, row) });
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
		var row = _.object(enHeaders,l);
		return l.map(function(c,i){ return normalizeValues(enHeaders[i],c, row) });
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
		var row = _.object(enHeaders,l);
		return l.map(function(c,i){ return normalizeValues(enHeaders[i],c, row) });
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
		var row = _.object(enHeaders,l);
		return l.map(function(c,i){ return normalizeValues(enHeaders[i],c, row) });
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
		var row = _.object(enHeaders,l);
		return l.map(function(c,i){ return normalizeValues(enHeaders[i],c, row) });
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
		var row = _.object(enHeaders,l);
		return l.map(function(c,i){ return normalizeValues(enHeaders[i],c, row) });
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
		var row = _.object(enHeaders,l);
		return l.map(function(c,i){ return normalizeValues(enHeaders[i],c, row) });
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
		var row = _.object(enHeaders,l);
		return l.map(function(c,i){ return normalizeValues(enHeaders[i],c, row) });
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
		var row = _.object(enHeaders,l);
		return l.map(function(c,i){ return normalizeValues(enHeaders[i],c, row) });
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
		var row = _.object(enHeaders,l);
		return l.map(function(c,i){ return normalizeValues(enHeaders[i],c, row) });
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
		var row = _.object(enHeaders,l);
		return l.map(function(c,i){ return normalizeValues(enHeaders[i],c, row) });
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
		var row = _.object(enHeaders,l);
		return l.map(function(c,i){ return normalizeValues(enHeaders[i],c, row) });
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
		var row = _.object(enHeaders,l);
		return l.map(function(c,i){ return normalizeValues(enHeaders[i],c, row) });
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
		var row = _.object(enHeaders,l);
		return l.map(function(c,i){ return normalizeValues(enHeaders[i],c, row) });
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
		var row = _.object(enHeaders,l);
		return l.map(function(c,i){ return normalizeValues(enHeaders[i],c, row) });
	});
}

var haskaotAherot = function(headers, dataLines){
	var enHeaders = headers.map(function(h){return h.columnName});
	return dataLines.filter(function(l){
		return (
			isNotEmpty(l[ enHeaders.indexOf("rating_agency") ])
		);
	}).map(function(l){
		var row = _.object(enHeaders,l);
		return l.map(function(c,i){ return normalizeValues(enHeaders[i],c, row) });
	});
}

var normalizeValues = function(enName, value, row){

//	console.log("row" + JSON.stringify(row));

	switch(enName){
		case 'instrument_symbol': 	return cleanString(value);
		case 'instrument_id': 		return cleanInstrumentId(cleanString(value)); //?????
		case 'underlying_asset': 	return cleanString(value);
		case 'instrument_type': 	return cleanString(value);
		case 'instrument_sub_type': return cleanString(value);
		case 'industry': 			return cleanString(normalizeIndustry(value));
		case 'rating': 				return cleanString(normalizeRating(value));
		case 'rating_agency': 		return cleanString(value);
		case 'date_of_purchase': 	return parseDate(value);
		case 'average_of_duration': return cleanNumber(cleanString(value));
		case 'currency': 			return cleanString(normalizeCurrency(value));
  		case 'intrest_rate': 		return cleanNumber(cleanString(value));
		case 'yield': 				return cleanNumber(cleanString(value));
		case 'par_value': 			return cleanNumber(value);
		case 'rate': 				return cleanNumber(cleanString(value));
		case 'market_cap': 			return cleanNumber(value);
		case 'fair_value': 			return cleanNumber(value);
		case 'rate_of_ipo': 		return cleanNumber(cleanString(value));
		case 'rate_of_fund': 		return cleanNumber(cleanString(value));
		case 'date_of_revaluation': return parseDate(value);
		case 'type_of_asset': 		return cleanString(value);
		case 'tmp_name': 			return cleanString(value);
		default:
			throw new Error("Unexpected column header value given: \"" + enName + "\"")
	}
}
