
var fs = require('fs'),
    pg = require('pg'),
    _ = require('underscore'),
    moment = require('moment'),
    metaTable = require(__dirname + '/common/MetaTable').getMetaTable(),
    columnsNames = metaTable.englishColumns,
    columnsTypes = metaTable.dataTypes;

var defaultColumnnNames = ['managing_body', 'fund' ,'report_year', 'report_qurater', 'instrument_type', 'instrument_sub_type'];
var defaultColumnnTypes = ['string', 'number' ,'number', 'number', 'string', 'string'];

columnsNames = defaultColumnnNames.concat(columnsNames);
columnsTypes = defaultColumnnTypes.concat(columnsTypes);

var defaultColumnsNamesMapping = defaultColumnnNames.map(function(c) { return { columnName: c }; });

var config;
try {
  config = require("./_config");
} catch (ignore){
  config = require('./config');
}

var tableName = config.table || 'data';

var db = {};

db.csv = function(filename) {
  if (filename === undefined) {
    filename = "dump.csv";
  }

  var exists = fs.existsSync(filename);

  this.stream = fs.createWriteStream(filename, { flags: 'a+', encoding: "utf8", mode: 0666 });
  
  if (!exists){
    this.stream.write(columnsNames.join(',') + "\n");
  }
};

db.csv.write = function(filename, mapping,managing_body, fund, report_year, report_qurater, instrument_type, instrument_sub_type, objects){

  var exists = fs.existsSync(filename);
  var stream = fs.createWriteStream(filename, { flags: 'a+', encoding: "utf8", mode: 0666 });
  if (!exists){
    stream.write(columnsNames.join(',') + "\n");
  }

  var mapping = defaultColumnsNamesMapping.concat(mapping);
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

  objects.forEach(function(object) {
    object = [managing_body, fund.toString(), report_year.toString(), report_qurater.toString(), instrument_type, instrument_sub_type].concat(object);

    var str = "";
    for (i = 0; i < indexes.length; ++i) {
      var idx = indexes[i];
      if (idx >= 0){
        str = str + (object[idx] ?  object[idx] : "");
      }
      if (i != indexes.length-1) {
        str = str + ",";
      } else {
        str = str + "\n";
      }
    }
    stream.write(str);
  });

}

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
    
    return function(managing_body, fund, report_year, report_qurater, instrument_type, instrument_sub_type, objects) {
      objects.forEach(function(object) {
        object = [managing_body, fund.toString(), report_year.toString(), report_qurater.toString(), instrument_type, instrument_sub_type].concat(object);

        for (i = 0; i < indexes.length; ++i) {
          var idx = indexes[i];
          if (idx >= 0){
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

var a  = 0;
db.pg = function() {
  var self = this;
  pg.connect(config.connection_string, function(err, client, done){
    self.tablesCounter = 0;
    var createTable = "CREATE TABLE " + tableName + "(id BIGSERIAL PRIMARY KEY, ";
    var fields = _.zip(columnsNames, columnsTypes.map(mapColumnType2Sql));
    createTable += fields.filter(function(f) { return !!f[0] && !!f[1]; }).map(function(f) { return f[0] + " " + f[1]; }).join(',');
    createTable += ");";

    
    client.query(createTable, function(err) {
      if(!err) {
        client.query('GRANT SELECT ON ' + tableName + ' TO opro;', function(err) {
          if (err) {
            console.log("error in grant", err);
          }
          console.log(">>1a");
        });
      } else {
        console.log("error in create", err);
      }
    });
  })
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

    var sql = "INSERT INTO " + tableName + "(" + mapping.map(function(m) { return m.columnName; }).join(',') + ")  " +
                   "VALUES (" + _.range(mapping.length).map(function(n) { return "$" + (n+1);}) + ");";

    var statment = { name: name, text: sql, values: null };

    return function(managing_body, fund, report_year, report_qurater, instrument_type, instrument_sub_type, objects) {
      pg.connect(config.connection_string, function(err, client, done){
        objects.forEach(function(object) {
          var values = [managing_body, fund, report_year, report_qurater, instrument_type, instrument_sub_type].concat(object.map(function(f, i) { return fieldsPreps[i](f) || null; }));
          statment.values = values;
          client.query(statment, function(err) {
            if (err){
              console.log("Error in DB of object:", err);
              console.log(values);
              console.log(object);
              console.log("***********************************");
            }
            done();
          });
        });
      })
    };
  }
};

exports.closePool = function(){
  console.log("closing pool...");
  pg.connect(config.connection_string, function(err, client, done){
    var q = client.query("select count(*) from " + tableName, function(err, res){
      console.log("now db has " + res.rows[0].count + " rows");
    })
    q.on("end", function(){
      process.exit();
    })
  })
}

exports.pg = db.pg;
exports.csv = db.csv;
exports.open = function() {
  if (config.db_mode == "csv")
    return new db.csv("dump.csv");
  else
    return new db.pg();
};