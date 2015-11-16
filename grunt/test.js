'use strict';
var test = require('./../src/test');
var _ = require('underscore');
var Promise = require('promise');

module.exports = function (config, args) {
    args = args || [];
    config.tests = config.tests || {};
    var keepalive = args[1] === 'server';
    var testKeys = _.keys(config.tests);

    // if we're keeping server alive, we're only running the first test suite
    if (keepalive) {
        testKeys = [testKeys[0]];
    }

    return testKeys.reduce(function (prevPromise, testId) {
        return prevPromise.then(function () {
            return test({
                id: testId,
                files: config.tests[testId].src,
                keepalive: keepalive
            });
        });
    }, Promise.resolve());
};