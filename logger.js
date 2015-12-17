var winston = require('winston');
var path = require('path');

module.exports = function(module){
  var moduleFileName = path.basename(module.filename);

  return new (winston.Logger)({
    transports: [
      new (winston.transports.Console)({
            level: 'info', //debug
            formatter: function(log) {
              return "["+ log.level.toUpperCase() +"] "+moduleFileName+": "+ log.message;
            }
          }
      ),
      new (winston.transports.File)({
        name: 'debug-file',
        filename: 'debug.log',
        json: false,
        level: 'debug',
        formatter: function(log) {
          return "["+ log.level.toUpperCase() +"] "+moduleFileName+": "+ log.message;
        }
      }),
      new (winston.transports.File)({
        name: 'error-file',
        json: false,
        filename: 'error.log',
        level: 'warn',
        formatter: function(log) {
          return "["+ log.level.toUpperCase() +"] "+moduleFileName+": "+ log.message;
        }
      })
    ],
    levels: {
      error: 4,
      warn: 3,
      info: 2,
      debug: 1
    }
  });
};


