'use strict';

var build = require('./../src/build');
var utils = require('./../src/utils');
var test = require('./test');

/**
 * Builds files into dist folder using build tools.
 * @returns {Promise}
 */
module.exports = function (c, args) {
    var config = utils.getConfig() || {};
    var env = args[0];
    var runTests;

    // do not run tests if local build
    if (env !== "local") {
        runTests = test(config, args);
    } else {
        runTests = Promise.resolve();
    }

    return runTests.then(function () {
        config.build = config.build || {};
        config.build.env = args[0];
        config.build.dist = config.dist;
        config.build.watch = env === "local";
        return build(config.build);
    });
};