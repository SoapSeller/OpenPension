
var vd = require("./validator.js"),
    pg = require('pg'),
    db = require('./db.js');

var errHandler = function(err) { console.log("ERR", err); };

var x = 0;
var insertSome = function() {
    var lim = x + 50;
    pg.connect(db.config.connection_string, function(err, client, done){
        var doInsert = function() {
            ++x;
            client.query("INSERT INTO testTable(val) values(1);", function(err) {
                if (err) {
                    console.log(err);
                    process.exit();
                }
                if (x < lim) {
                    doInsert();
                } else {
                    checkInserts();
                }
            });
        };

        doInsert();
    });
};

var checkInserts = function() {
    pg.connect(db.config.connection_string, function(err, client, done){

        client.query("SELECT SUM(val) AS currentcount FROM testTable;", function(err, result) {
            if (err) {
                console.log(err);
                process.exit();
            }
            var count = parseInt(result.rows[0].currentcount, 10);
            console.log(x, count, count === x);
            insertSome();
        });
    });
};

pg.connect(db.config.connection_string, function(err, client, done){
    client.query("DROP TABLE testTable;", function(err) {
        if (err) {
            console.log(err);
            process.exit();
        }
        client.query("CREATE TABLE testTable (id BIGSERIAL PRIMARY KEY, val NUMERIC);", function(err) {
            if (err) {
                console.log(err);
                process.exit();
            }
            insertSome();
        });
    });
});
