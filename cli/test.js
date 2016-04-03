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
    config.tests = config.tests || {src: {}};
    var keepalive = args[1] === 'server';
    var testIds = _.keys(config.tests);
    var testId = args[0] || testIds[0];
    config = config.tests[testId] || {};
    var requires = config.requires || {};
    for (let id in requires) {
        if (requires.hasOwnProperty(id)) {
            requires[id] = path.resolve(process.cwd(), requires[id]);
        }
    }

    return test({
        id: testId,
        files: config.src,
        keepalive: keepalive,
        requires: requires
    });
};
