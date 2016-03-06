"use strict";
var test = require('./test');
var version = require('./../src/version');
var bump = require('./../src/bump');
var build = require('./build');

/**
 * Bumps the package version, runs a build, then commits and pushes updated version.
 * @returns {Promise}
 */
module.exports = function (args) {
    var semVersion = args[0];
    return test().then(function () {
        return bump(semVersion).then(function (nextVersion) {
            return build().then(function () {
                return version(nextVersion);
            });
        });
    }).catch(function (err) {
        console.error(err);
    });
};