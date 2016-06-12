'use strict';
var nopt = require('nopt');
var path = require('path');
var Server = require('./../src/server');
var utils = require('./../src/utils');
var _ = require('underscore');

/**
 * Runs server.
 */
module.exports = function (args) {

    var config = utils.getConfig() || {};
    args = args || [];

    var argObject = nopt({
        port: [Number, null],
        staticDir: [String, null],
        middleware: [path],
        protocol: [String, null],
        hostname: [String, null]
    }, {}, args, 0);

    var env = argObject.argv.remain[0] || 'development';

    config = _.extend(config[env].server, argObject);

    console.log(config);
    return new Server(config).start();
};
