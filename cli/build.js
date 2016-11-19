'use strict';
var build = require('./../src/build');
var nopt = require('nopt');
var path = require('path');
var utils = require('./../src/utils');
var test = require('./../src/test');
var Promise = require('bluebird');

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

    // assume last argument is environment if not specified
    var env = argsObject.argv.remain[0] || argsObject.env;

    if (typeof env === 'undefined') {
        env = process.env.NODE_ENV || 'production';
        console.warn(`There is no environment was supplied, building ${env}...`);
    } else if (!config[env]) {
        console.error(`There is no environment named ${env}.. bailing.`);
        return Promise.resolve();
    }

    var envConfig = config[env] ||  config;
    var buildConfig = Object.assign({
        env: env,
        staticDir: process.cwd(),
    }, envConfig.build, argsObject);

    var runTest = function (testConfig) {
        testConfig = testConfig || {};
        var testIds = Object.keys(testConfig);
        return Promise.mapSeries(testIds, (id) => {
            let options = testConfig[id];
            options.id = id;
            return test(options);
        });
    };

    var runTests = function () {
        var testConfigs = envConfig.tests || [];
        if (!Array.isArray(testConfigs)) {
            testConfigs = [testConfigs];
        }
        if (testConfigs.length) {
            return Promise.mapSeries(testConfigs, (config) => {
               return runTest(config);
            });
        } else {
            return Promise.resolve();
        }
    };

    return build(buildConfig).then(function () {
        return runTests();
    });
};
