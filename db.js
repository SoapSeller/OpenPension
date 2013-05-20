
var fs = require('fs');


var validators = {
  always: function(val) { return val !== undefined; },
  type: function(val) { return -1 != ["stock", "bond"].indexOf(val); },
  forType: function(type, val) {
    if (this.type != type)
      return true;
    return val !== undefined;
  },
  forBond: function(val) {
    return validators.forType.call(this, "bond", val);
  }
};

var allFields = {
  "type": validators.type,
  "management": validators.always,
  "fund": validators.always,
  "financial_product_number": validators.always,
  "issuer": validators.always,
  "symbol": validators.always,
  "market": validators.always,
  "rating": validators.forBond,
  "rating_body": validators.forBond,
  "currency": validators.always,
  "interest_rate": validators.forBond,
  "duration": validators.forBond,
  "yield": validators.forBond,
  "market_cap": validators.always,
  "amount_of_public_shares": validators.forBond,
  "local" : validators.always,
  "instrument_sub_type" : validators.always,
  "instrument_type" : validators.always
};

var allFieldsNames = Object.keys(allFields);

var validate = function(object) {
  var badFields = [];
  for (var field in allFields) {
    if (!allFields[field].call(object, (object[field])))
      badFields.push(field);
  }

  return badFields.length > 0 ? badFields : null;
};

var createObject = function(fields, values) {
  var object = {};
  for (var i = 0; i < fields.length; ++i) {
    object[fields[i]] = values[i];
  }

  return object;
};

var writeRecord = function(db, type, fields, values) {
    var object = createObject(fields, values);
    object.type = type;
    var err = validate(object);
    if (err) {
      return err;
    }

    db.stream.write(allFieldsNames.map(function(f){ return object[f]; }).join(",") + "\n");
};

var db = function(filename) {
  if (filename === undefined) {
    filename = "db.csv";
  }

  this.stream = fs.createWriteStream(filename, { flags: 'w+', encoding: "utf8", mode: 0666 });

  this.stream.write(allFieldsNames.join(', ') + "\n");
};


db.prototype = {
  close: function() {
    this.stream.end();
  },
  bondFields: [ "management", "fund", "financial_product_number", "issuer", "symbol", "market", "rating", "rating_body", "currency", "interest_rate", "duration", "yield", "market_cap", "amount_of_public_shares" ],
  writeBond: function(management, fund, financial_product_number, issuer, symbol, market, rating, rating_body, currency, interest_rate, duration, yield, market_cap, amount_of_public_shares) {
    var values = [ management, fund, financial_product_number, issuer, symbol, market, rating, rating_body, currency, interest_rate, duration, yield, market_cap, amount_of_public_shares ];
    return writeRecord(this, "bond", bondFieldNames, values);

  },
  stockFields: [ "management", "fund", "financial_product_number", "issuer", "symbol", "market", "currency", "market_cap" ],
  writeStock: function(management, fund, financial_product_number, issuer, symbol, market, currency, market_cap) {
    var values = [ management, fund, financial_product_number, issuer, symbol, market, currency, market_cap ];
    return writeRecord(this, "stock", this.stockFields, values);
  },
  writeRecord: function(type, json) { // Debug onlu, TBD: Remove!
    return writeRecord(this, type, Object.keys(json), Object.keys(json).map(function(f) { return json[f]; }));
  }
};

exports.open = function(filename) {
  return new db(filename);
};


