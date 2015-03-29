'use strict';
var test = require('./../src/test');
var config = require('./../bt-config');

/**
 * Runs tests.
 * @param args - The cli arguments
 * @returns {*}
 */
module.exports = function (args) {
    return test(config, {
        keepalive: args[1] === 'server'
    });
};