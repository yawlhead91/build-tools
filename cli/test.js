'use strict';
var test = require('./../src/test');
var utils = require('./../src/utils');
var config = utils.getConfig() || {};
var _ = require('underscore');

/**
 * Runs tests.
 * @param args - The cli arguments
 * @returns {*}
 */
module.exports = function (args) {
    args = args || [];
    config.tests = config.tests || {src: {}};
    var keepalive = args[1] === 'server';
    var testIds = _.keys(config.tests);
    var testId = args[0] || testIds[0];

    return test({
        id: testId,
        files: config.tests[testId].src,
        keepalive: keepalive
    });
};
