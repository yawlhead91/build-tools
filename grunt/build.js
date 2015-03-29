'use strict';
var bt = require('build-tools');

/**
 * Builds files into dist folder using build tools.
 * @returns {Promise}
 */
module.exports = function (config) {
    return bt.build(config);
};