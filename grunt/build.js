'use strict';

var build = require('./../src/build');

/**
 * Builds files into dist folder using build tools.
 * @returns {Promise}
 */
module.exports = function (config) {
    return build(config);
};