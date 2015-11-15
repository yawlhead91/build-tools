'use strict';
var build = require('./../src/build');
var _ = require('underscore');

/**
 * Builds files specified in config file into the destination folder.
 * @returns {Promise}
 */
module.exports = function (args) {
    var config = require(process.cwd() + '/bt-config');

    var options = _.extend({
        env: args[0],
        files: null,
        dist: config.dist
    }, config.build);

    return build(options);
};