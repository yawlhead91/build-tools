'use strict';
let nopt = require('nopt');
let path = require('path');
let deploy = require('./../src/deploy');
let _ = require('underscore');
let utils = require('./../src/utils');

/**
 * Runs server.
 */
module.exports = function (args) {

    let config = utils.getConfig() || {};

    let options = nopt({
        hostname: [String],
        username: [String],
        protocol: [String, null],
        password: [String, null],
        port: [String, null],
        remoteDir: [path],
        path: [path]
    }, {}, args, 0);

    let env = options.argv.remain[0] || process.env.NODE_ENV || 'development';
    let envConfig = config[env] || {};
    options = _.extend(envConfig.deploy || config.deploy || {}, options);
    return deploy(options);
};
