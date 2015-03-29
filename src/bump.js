'use strict';
var Promise = require('promise');
var fs = require('fs-extra');
var semver = require('semver');
var _ = require('underscore');

/**
 * Bumps up the versions of all package files.
 * @param {string} [type] - a valid semver string (i.e. "patch", "minor", "major") (Defaults to "patch")
 * @returns {Promise} Returns a promise that resolves when completed
 * @type {exports}
 */
module.exports = function (type) {

    var promises = [],
        files = ['package.json', 'bower.json'];

    type = type || 'patch';

    var validateFiles = function (files) {
        var fileMaps = {},
            absolutePath,
            contents;
        files.forEach(function (path) {
            absolutePath = process.cwd() + '/' + path;
            try {
                contents = require(absolutePath);
            } catch (e) {
                // do nothing if file does not exist
                return;
            }

            fileMaps[path] = {
                file: path,
                contents: contents,
                currentVersion: contents.version
            };
        });
        return fileMaps;
    };

        var nextVersion;
        _.each(validateFiles(files), function (map, path) {
            promises.push(new Promise(function (resolve, reject) {
                nextVersion = semver.inc(map.currentVersion, type);
                if (map.contents && nextVersion) {
                    map.contents.version = nextVersion;
                    map.contents = JSON.stringify(map.contents, null, 2) + "\n";
                    try {
                        fs.writeFileSync(path, map.contents);
                    } catch (e) {
                        reject(e);
                    }
                }
                resolve();
            }));
        });
        return Promise.all(promises).then(function () {
            return Promise.resolve(nextVersion);
        }).catch(console.log);
};