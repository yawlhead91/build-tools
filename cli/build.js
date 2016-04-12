'use strict';
var build = require('./../src/build');
var _ = require('underscore');
var nopt = require('nopt');
var path = require('path');
var utils = require('./../src/utils');
var test = require('./test');
var Promise = require("promise");

/**
 * Builds files specified in config file into the destination folder.
 * @returns {Promise}
 */
module.exports = function (args) {
    var config = utils.getConfig() || {};
    args = args || [];

    var env = args[0] || 'prod';


    var argsObject = nopt({
        env: [String],
        files: [null],
        dist: [path],
        middleware: [path],
        port: [Number, null],
        staticDir: [path],
        test: [Boolean, true] // whether or not tests should run before build executes
    }, {}, args, 0);

    config.build = config.build || {};

    // use env config if exists
    if (env) {
        config.build = config.build[env];
    }

    var buildConfig = _.extend({
        env: env,
        staticDir: process.cwd()
    }, config.build, argsObject);

    var runTests = function (env) {
        // only run tests if this is NOT a local build, otherwise
        // tests would run every time a watched file is edited.
        if (!buildConfig.test || env === "local") {
            return Promise.resolve();
        } else {
            return test();
        }
    };

    return runTests(buildConfig.env).then(function () {
        return build(buildConfig);
    });
};
