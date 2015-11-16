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
    var config = require(process.cwd() + '/bt-config');
    var env = args[0];

    args = nopt({
        env: [String],
        files: [null],
        dist: [path],
        middleware: [path]
    }, {}, args, 0);

    var options = _.extend({
        env: env,
        dist: config.dist
    }, config.build, args);

    console.log(options);

    return build(options);
};