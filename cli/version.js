'use strict';
var version = require('./../src/version');

/**
 * Runs tests.
 * @param args - The cli arguments
 * @returns {*}
 */
module.exports = function (args) {
    return version(args[0]);
};