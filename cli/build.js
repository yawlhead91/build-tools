'use strict';
var build = require('./../src/build');

/**
 * Builds files specified in config file into the destination folder.
 * @returns {Promise}
 */
module.exports = function (args) {
    return build(require(process.cwd() + '/bt-config'));
};