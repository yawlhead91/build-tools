'use strict';
var build = require('./../src/build');
var _ = require('underscore');
var nopt = require('nopt');
var path = require('path');
var utils = require('./../src/utils');
var test = require('./test');
var Promise = require("promise");

/**
 * Builds files specified in config file into the destination folder.
 * @returns {Promise}
 */
module.exports = function (args) {
    var config = utils.getConfig() || {};
    var env = args[0];

    args = nopt({
        env: [String],
        files: [null],
        dist: [path],
        middleware: [path],
        port: [Number, null],
        staticDir: [String, null]
    }, {}, args, 0);


    var options = _.extend({
        env: env,
        dist: config.dist
    }, config.build, args);

    var runTests = function (args) {
        if (env !== "local") {
            return test(args);
        } else {
            return Promise.resolve();
        }
    };

    return runTests(args).then(function () {
        options.watch = env === "local";
        return build(options);
    });
};
