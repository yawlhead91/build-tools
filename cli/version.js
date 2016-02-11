'use strict';
var version = require('./../src/version');

/**
 * Bumps the version of the npm package, commits it as an
 * entry and pushes it both locally and remotely to the master branch repo.
 * @param args - The cli arguments
 * @returns {*}
 */
module.exports = function (args) {
    return version(args[0]);
};