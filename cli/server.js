'use strict';
var nopt = require('nopt');
var path = require('path');
var Server = require('./../src/server');

/**
 * Runs server.
 */
module.exports = function (args) {

    var options = nopt({
        port: [Number, null],
        staticDir: [String, null],
        middleware: [path],
        protocol: [String, null],
        hostname: [String, null]
    }, {}, args, 0);

    return new Server(options).start();
};
