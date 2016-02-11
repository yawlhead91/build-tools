'use strict';
var build = require('./../src/build');
var bump = require('./../src/bump');
var utils = require('./../src/utils');
var config = utils.getConfig() || {};

/**
 * Creates a release by upping the package.json and bower.json files, then runs a
 * build to compile all code into the dist folder. NOTE: This assumes a prod build.
 * @param args - The cli arguments
 * @returns {*}
 */
module.exports = function(args) {
    var version = args[0];
    return bump(version).then(function () {
        return build(config);
    });
};