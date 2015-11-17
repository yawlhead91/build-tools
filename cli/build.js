'use strict';
var build = require('./../src/build');
var _ = require('underscore');
var nopt = require('nopt');
var path = require('path');

/**
 * Builds files specified in config file into the destination folder.
 * @returns {Promise}
 */
module.exports = function (args) {
    var config;
    var env = args[0];

    try {
        config = require(process.cwd() + '/bt-config');
    } catch (err) {
        config = {};
    }

    args = nopt({
        env: [String],
        files: [null],
        dist: [path],
        middleware: [path],
        port: [Number, null]
    }, {}, args, 0);


    var options = _.extend({
        env: env,
        dist: config.dist
    }, config.build, args);

    return build(options);
};