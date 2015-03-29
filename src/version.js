'use strict';
var git = require('gitty');
var Promise = require('promise');
var bump = require('./bump');
var path = require('path');


/**
 * Ups the current package to a new version and commits it locally.
 * Imitates `npm version` functionality: https://docs.npmjs.com/cli/version
 * @param {string} [type] - a valid semver string (defaults to patch)
 * @returns {Promise} Returns a promise that resolves when completed
 * @type {exports}
 */
module.exports = (function (type) {
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

    var getBumpedFiles = function () {
        var files = [];
        return new Promise(function (resolve, reject) {
            localRepo.status(function (err, status) {
                if (err) return reject(err);
                // only return unstaged files because that should
                // be the only thing that was modified
                status.unstaged.forEach(function (obj) {
                    files.push(obj.file);
                });
                resolve(files);
            });
        });
    };

    var stageFiles = function (files) {
        console.log('staging files...');
        return new Promise(function (resolve, reject) {
            console.log(files);
            localRepo.add(files, function (err) {
                if (err) return reject(err);
                console.log('staging files completed!');
                resolve();
            });
        });
    };

    var commit = function (newVersionNum) {
        console.log('committing locally...');
        return new Promise(function (resolve, reject) {
            localRepo.commit(newVersionNum, function (err) {
                if (err) return reject(err);
                console.log('committing completed!');
                resolve();
            });
        });
    };

    var createTag = function () {
        console.log('creating tag...');
        return new Promise(function (resolve, reject) {
            localRepo.createTag(newVersionNum, function (err) {
                if (err) return reject(err);
                console.log('tag creation completed!');
                resolve();
            });
        });
    };

    var pushTag = function () {
        console.log('pushing new tag to remote...');
        return new Promise(function (resolve, reject) {
            localRepo.createTag(newVersionNum, function (err) {
                if (err) return reject(err);
                console.log('tag pushed to remote completed!');
                resolve();
            });
        });
    };

    var merge = function (branch) {
        console.log('attempting to merge new version into ' + branch + '...');
        return new Promise(function (resolve, reject) {
            // get current branch so we can navigate back to it when done
            localRepo.getBranches(function (err, branches) {
                if (err) return reject(err);
                localRepo.checkout(branch, function (err) {
                    if (err) return reject(err);
                    localRepo.merge(branches.current, function (err) {
                        if (err) return reject(err);
                        // push result to Github
                        localRepo.push('origin', branch, function (err) {
                            if (err) return reject(err);
                            // merge done, now navigate back to original branch
                            localRepo.checkout(branches.current, function (err) {
                                if (err) return reject(err);
                                console.log('merging completed!');
                                resolve();
                            });
                        });

                    });
                });
            });
        });
    };

    return ensureCleanWorkingDirectory().then(function () {
        return bump(type).then(function (newVersionNum) {
            return getBumpedFiles().then(function (bumpedFiles) {
                console.log(arguments);
                return stageFiles(bumpedFiles).then(function () {
                    return commit(newVersionNum).then(function () {
                        return merge('master');
                    });
                });
            });
        });
    }).catch(console.log);
})();