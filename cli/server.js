'use strict';
var nopt = require('nopt');
var path = require('path');

/**
 * Runs server.
 */
module.exports = function (args) {

    var options = nopt({
        port: [Number, null],
        staticDir: [String, null],
        middleware: [path]
    }, {}, args, 0);

    return require('./../src/server')(options);
};