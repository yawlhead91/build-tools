'use strict';
var test = require('./../src/test');
var utils = require('./../src/utils');
var config = utils.getConfig() || {};
var _ = require('underscore');
var path = require('path');

/**
 * Runs tests.
 * @param args - The cli arguments
 * @returns {*}
 */
module.exports = function (args) {
    args = args || [];
    config.tests = config.tests || {};
    var testIds = _.keys(config.tests);
    var testId = args[0] || testIds[0];
    var testOptions = config.tests[testId] || {src: []};

    testOptions = _.extend({}, {
        id: testId,
        files: testOptions.src,
        keepalive: args[1] === 'server',
        browserifyOptions: config.tests.browserifyOptions,
    }, testOptions);

    testOptions.requires = testOptions.requires || {};
    for (let id in testOptions.requires) {
        if (testOptions.requires.hasOwnProperty(id)) {
            let requirePath = testOptions.requires[id];
            testOptions.requires[id] = path.resolve(process.cwd(), requirePath);
        }
    }

    return test(testOptions);
};
