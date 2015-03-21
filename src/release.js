'use strict';
var Promise = require('promise');
var build = require('./build');
var utils = require('./utils');
var semver = require('semver');
var fs = require('fs-extra');

module.exports = function(grunt, args) {

    var files = ['package.json', 'bower.json'],
        type = args[0] || 'patch';

    var bumpFiles = function () {
        var promises = [],
            filePaths = utils.scopePaths(files);

        filePaths.forEach(function (path) {
            promises.push(new Promise(function (resolve, reject) {
                var contents = require(path) || {},
                    currentVersion = contents.version,
                    nextVersion = semver.inc(currentVersion, type);

                if (contents && nextVersion) {
                    contents.version = nextVersion;
                    contents = JSON.stringify(contents, null, 2) + "\n";
                    try {
                        fs.writeFileSync(path, contents);
                    } catch (e) {
                        reject(e);
                    }
                }
                resolve();
            }));
        });
        return Promise.all(promises);
    };

    return bumpFiles().then(function () {
        return build(grunt, args);
    });
};
