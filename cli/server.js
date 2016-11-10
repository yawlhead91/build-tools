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

    var options = nopt({
        port: [Number, null],
        staticDir: [String, null],
        middleware: [path],
        protocol: [String, null],
        hostname: [String, null]
    }, {}, args, 0);

    var env = options.argv.remain[0] || process.env.NODE_ENV || 'development';

    if (config[env]) {
        config = config[env];
    }
    options = _.extend(config.server, options);
    return new Server(options).start();

};
