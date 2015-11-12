'use strict';
var build = require('./../src/build');

/**
 * Builds files specified in config file into the destination folder.
 * @returns {Promise}
 */
module.exports = function (args) {
    var options = require(process.cwd() + '/bt-config');
    options.env = args[0];
    return build(options);
};