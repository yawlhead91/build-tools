'use strict';
var nopt = require('nopt');

/**
 * Runs server.
 */
module.exports = function (args) {

    var options = nopt({
        port: [String, null],
        staticDir: [String, null]
    }, {}, args, 0);

    return require('./../src/server')(options);
};