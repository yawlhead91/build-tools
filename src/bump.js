var Promise = require('promise');
var fs = require('fs-extra');

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

    files.forEach(function (path) {
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