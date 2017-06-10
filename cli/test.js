'use strict';
let test = require('./../src/test');
let utils = require('./../src/utils');
let nopt = require('nopt');
let Promise = require('bluebird');

/**
 * Runs tests.
 * @param args - The cli arguments
 * @returns {*}
 */
module.exports = function (args) {
    let config = utils.getConfig() || {};
    args = args || [];

    let argsObject = nopt({
        env: [String],
        files: [null],
        type: [String, null],
        server: [Boolean, false],
    }, {}, args, 0);

    let env = argsObject.env || process.env.NODE_ENV || 'development';

    // assume last argument is the server boolean
    let remainingArgs = argsObject.argv.remain;
    let server = argsObject.server || remainingArgs[remainingArgs.length - 1] === 'server' ? true : false;

    let envConfig = config[env] || config || {};
    let testConfigs = envConfig.tests || [];

    if (!testConfigs.length) {
        // not an array
        testConfigs = [testConfigs];
    }

    if (!testConfigs.length) {
        console.warn(`There are no test files for ${env} environment to run.`);
        return Promise.resolve();
    }


    /**
     * Determines whether to keep the server alive.
     * @returns {boolean}
     */
    let determineKeepAlive = function () {
        let testType = argsObject.type || remainingArgs[0]; // assume first argument is test type
        // we only keep server alive if user explicitly
        // wants it by using it in a CLI command ONLY and
        // there is only one test
        let testConfigsById = testConfigs.filter((config) => {
            return Object.keys(config).includes(testType);
        });
        if (testConfigsById.length > 1) {
            console.warn(`You cannot run the test server if there are multiple tests in your configuration`);
            return false;
        } else {
            return testConfigsById.length === 1;
        }
    };
    let keepAlive = server && determineKeepAlive();

    return Promise.mapSeries(testConfigs, (testConfig) => {
        let testIds = Object.keys(testConfig);
        return Promise.mapSeries(testIds, (testId) => {
            let options = testConfig[testId];
            options.browserifyOptions = options.browserifyOptions || testConfig.browserifyOptions;
            options.id = testId;
            options.keepalive = keepAlive;
            return test(options);
        });
    });

};
