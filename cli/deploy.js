'use strict';
var nopt = require('nopt');
var path = require('path');
var deploy = require('./../src/deploy');
var _ = require('underscore');
var utils = require('./../src/utils');

/**
 * Runs server.
 */
module.exports = function (args) {

    var config = utils.getConfig() || {};

    var options = nopt({
        hostname: [String],
        username: [String],
        protocol: [String, null],
        password: [String, null],
        port: [String, null],
        remoteDir: [path],
        path: [path]
    }, {}, args, 0);

    var env = options.argv.remain[0] || process.env.NODE_ENV || 'development';
    var envConfig = config[env] || {};
    options = _.extend(envConfig.deploy || config.deploy || {}, options);
    return deploy(options);
};
