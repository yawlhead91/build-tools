'use strict';
var git = require('gitty');
var Promise = require('promise');
var bump = require('./bump');

/**
 * Ups the current package to a new version and commits it locally.
 * Imitates `npm version` functionality: https://docs.npmjs.com/cli/version
 * @param {string} [type] - a valid semver string (defaults to patch)
 * @returns {Promise} Returns a promise that resolves when completed
 * @type {exports}
 */
module.exports = function (type) {
    var localRepo = git(process.cwd()),
        newVersionNum;

    var getEditedFiles = function () {
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
            localRepo.add(files, function (err) {
                if (err) return reject(err);
                console.log('staging files completed!');
                resolve();
            });
        });
    };

    var commit = function () {
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
            localRepo.push('origin', newVersionNum, function (err) {
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
                            // create and push tags
                            return createTag(newVersionNum).then(function () {
                                return pushTag(newVersionNum).then(function () {
                                    if (err) return reject(err);
                                    // merge done, now navigate back to original branch
                                    localRepo.checkout(branches.current, function (err) {
                                        if (err) return reject(err);
                                        console.log('merging completed!');
                                        resolve();
                                    });
                                })
                            });
                        });
                    });
                });
            });
        });
    };

    return bump(type).then(function (newVersion) {
        newVersionNum = newVersion;
        return getEditedFiles().then(function (editedFiles) {
            return stageFiles(editedFiles).then(function () {
                return commit(newVersionNum).then(function () {
                    return merge('master');
                });
            });
        });
    }).catch(console.log);
};