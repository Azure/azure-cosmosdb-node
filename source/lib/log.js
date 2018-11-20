var log = require("debug")("documentdb");

var debug = log.extend("debug");
var info = log.extend("info");
var warn = log.extend("warn");
var error = log.extend("error");

var logBuilder = function(namespace) {
    return {
        debug: debug.extend(namespace),
        info: info.extend(namespace),
        warn: warn.extend(namespace),
        error: error.extend(namespace)
    };
};

module.exports = logBuilder;
