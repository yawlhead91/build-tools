'use strict';
var version = require('./../src/version');
var git = require('gitty');

/**
 * Bumps the version of the npm package, commits it as an
 * entry and pushes it both locally and remotely to the master branch repo.
 * @param args - The cli arguments
 * @returns {*}
 */
module.exports = function (args) {

    var localRepo = git(process.cwd());

    var ensureCleanWorkingDirectory = function () {
        return new Promise(function (resolve, reject) {
            localRepo.status(function (err, status) {
                if (err) return reject(err);
                if (status && !status.staged.length && !status.unstaged.length && !status.untracked.length) {
                    resolve();
                } else {
                    // working directory is dirty! so bail
                    console.error('Your working directory must be clean before you ' +
                        'can create a new version of your package');
                    reject();
                }
            });
        });
    };
    return ensureCleanWorkingDirectory().then(function () {
        return version(args[0]);
    });
};