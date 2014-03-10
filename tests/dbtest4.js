
var vd = require("./validator.js"),
    pg = require('pg'),
    db = require('./db.js');

var errHandler = function(err) { console.log("ERR", err); };

var client = new pg.Client(db.config.connection_string);
client.connect();

var x = 0;
var actualInsert = function(statment) {
    client.query(statment, function(err) {
    if (err) {
        console.log(err);
        process.exit();
    }
});
};
var insertSome = function() {
    var lim = x + 50;
    var statment = { name: "st_" + x, text: "INSERT INTO testTable(val) VALUES($1);", values: [1] };

    for (; x < lim; ++x)
    {
        actualInsert(statment);
    }
    checkInserts();
};

var checkInserts = function() {

    client.query("SELECT SUM(val) AS currentcount FROM testTable;", function(err, result) {
        if (err) {
            console.log(err);
            process.exit();
        }
        var count = parseInt(result.rows[0].currentcount, 10);
        console.log(x, count, count === x);
        insertSome();
    });
};

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
