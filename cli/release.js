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
    args = args || [];
    var semVersionType = args[0];
    return test().then(function () {
        return bump(semVersionType).then(function (nextVersion) {
            // we are disabling tests from being ran
            // during build because we've already done it above
            return build(['prod', '--test=false']).then(function () {
                return version(nextVersion);
            });
        });
    }).catch(function (err) {
        console.error(err);
    });
};