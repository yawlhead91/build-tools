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

    var argsObject = nopt({
        env: [String],
        files: [null],
        dist: [path],
        middleware: [path],
        port: [Number, null],
        staticDir: [path],
        test: [Boolean, true], // whether or not tests should run before build executes
        watch: [Boolean, false]
    }, {}, args, 0);

    var env = argsObject.argv.remain[0] || 'production';

    config.build = config.build || {};
    config.build = config.build[env] || config.build['production'] || config.build;

    var buildConfig = _.extend({
        env: env,
        // only run tests if this is NOT a local build, otherwise
        // tests would run every time a watched file is edited.
        test: env !== "local",
        staticDir: process.cwd(),
        watch: env === "local"
    }, config.build, argsObject);

    var runTests = function () {
        if (!buildConfig.test) {
            return Promise.resolve();
        } else {
            return test();
        }
    };

    return runTests().then(function () {
        return build(buildConfig);
    });
};
