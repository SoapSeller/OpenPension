
var config = require('./config'),
    fs = require('fs'),
    pg = require('pg'),
    _ = require('underscore'),
    moment = require('moment'),
    metaTable = require('./common/MetaTable').getMetaTable(),
    columnsNames = metaTable.englishColumns,
    columnsTypes = metaTable.dataTypes;

var defaultColumnnNames = ['managing_body', 'report_year', 'report_qurater', 'instrument_type', 'instrument_sub_type'];
var defaultColumnnTypes = ['string', 'number', 'number', 'string', 'string'];

columnsNames = defaultColumnnNames.concat(columnsNames);
columnsTypes = defaultColumnnTypes.concat(columnsTypes);

var defaultColumnsNamesMapping = defaultColumnnNames.map(function(c) { return { columnName: c }; });

var db = {};

db.csv = function(filename) {
  if (filename === undefined) {
    filename = "dump.csv";
  }

  this.stream = fs.createWriteStream(filename, { flags: 'w+', encoding: "utf8", mode: 0666 });

  this.stream.write(columnsNames.join(', ') + "\n");
};

db.csv.prototype = {
  openTable: function(mapping) {
    var that = this;

    mapping = defaultColumnsNamesMapping.concat(mapping);

    var indexes = [];
    columnsNames.forEach(function(column) {
      var idx = -1;
      for (i = 0; i < mapping.length; ++i) {
        if (mapping[i].columnName == column) {
          idx = i;
          break;
        }
      }
      indexes.push(idx);
    });
    console.log(_.zip(columnsNames, indexes));
    return function(managing_body, report_year, report_qurater, instrument_type, instrument_sub_type, objects) {
      objects.forEach(function(object) {
        object = [managing_body, report_year.toString(), report_qurater.toString(), instrument_type, instrument_sub_type].concat(object);
        console.log(object);

        for (i = 0; i < indexes.length; ++i) {
          var idx = indexes[i];
          if (idx >= 0)
          {
            that.stream.write(object[idx] ?  object[idx] : "");
          }
          if (i != indexes.length-1) {
            that.stream.write(",");
          } else {
            that.stream.write("\n");
          }
        }
      });
    };
  }
};

var columnsTypesMappings = {
  number: "numeric",
  date: "date",
  string: "varchar(128)"
};

var columnsTypesPreperares = {
  date: function(d) { return moment(d, "DD-MM-YYYY"); }
};
var identityPreperare = function(o) {
  return o;
};

var mapColumnType2Sql = function(type) {
  var dbtype = columnsTypesMappings[type];
  return dbtype;
};

db.pg = function() {
  this.client = new pg.Client(config.connection_string);
  this.client.connect();

  this.tablesCounter = 0;

  var createTable = "CREATE TABLE data(id BIGSERIAL PRIMARY KEY, ";
  var fields = _.zip(columnsNames, columnsTypes.map(mapColumnType2Sql));
  createTable += fields.filter(function(f) { return !!f[0] && !!f[1]; }).map(function(f) { return f[0] + " " + f[1]; }).join(',');
  createTable += ");";

  this.client.query(createTable, function(err) {
    if(!err) {
      this.client.query('GRANT SELECT ON data TO opublic;');
    }
  });
};

db.pg.prototype = {
  openTable: function(mapping) {
    var that = this;

    var name = "table_" + (++this.tablesCounter);

    mapping = defaultColumnsNamesMapping.concat(mapping);

    var fieldsPreps = [];
    mapping.forEach(function(m) {
      var idx = columnsNames.indexOf(m.columnName);
      var prep = columnsTypesPreperares[columnsTypes[idx]];
      if (prep !== undefined) {
        fieldsPreps.push(prep);
      } else {
        fieldsPreps.push(identityPreperare);
      }
    });

    var sql = "INSERT INTO data(" + mapping.map(function(m) { return m.columnName; }).join(',') + ")  " +
                   "VALUES (" + _.range(mapping.length).map(function(n) { return "$" + (n+1);}) + ");";

    var statment = { name: name, text: sql, values: null };

    return function(managing_body, report_year, report_qurater, instrument_type, instrument_sub_type, objects) {
      objects.forEach(function(object) {
        statment.values = [managing_body, report_year, report_qurater, instrument_type, instrument_sub_type].concat(object.map(function(f, i) { return fieldsPreps[i](f); }));
        that.client.query(statment, function(err) {
          if (err){
            console.log("Error in DB of object:", err);
            console.log(object);
            console.log("***********************************");
          }
        });
      });
    };
  }
};

exports.pg = db.pg;
exports.csv = db.csv;
exports.open = function() {
  if (config.db_mode == "csv")
    return new db.csv("dump.csv");
  else
    return new db.pg();
};


