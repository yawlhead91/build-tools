'use strict';
let build = require('./../src/build');
let nopt = require('nopt');
let path = require('path');
let utils = require('./../src/utils');
let test = require('./../src/test');
let Promise = require('bluebird');

/**
 * Builds files specified in config file into the destination folder.
 * @returns {Promise}
 */
module.exports = function (args) {
    let config = utils.getConfig() || {};
    args = args || [];

    let argsObject = nopt({
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
    let env = argsObject.argv.remain[0] || argsObject.env;

    if (typeof env === 'undefined') {
        env = process.env.NODE_ENV || 'production';
        console.warn(`There is no environment was supplied, building ${env}...`);
    } else if (!config[env]) {
        console.error(`There is no environment named ${env}.. bailing.`);
        return Promise.resolve();
    }

    let envConfig = config[env] ||  config;
    let buildConfig = Object.assign({
        env: env,
        staticDir: process.cwd(),
    }, envConfig.build, argsObject);

    let runTest = function (testConfig) {
        testConfig = testConfig || {};
        let testIds = Object.keys(testConfig);
        return Promise.mapSeries(testIds, (id) => {
            let options = testConfig[id];
            options.id = id;
            return test(options);
        });
    };

    let runTests = function () {
        let testConfigs = envConfig.tests || [];
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
