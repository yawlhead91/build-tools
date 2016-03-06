'use strict';
var git = require('gitty');
var Promise = require('promise');
var bump = require('./bump');
var _ = require('underscore');
var semver = require('semver');

/**
 * Ups the current package to a new version and commits it locally.
 * Imitates `npm version` functionality: https://docs.npmjs.com/cli/version
 * @param {string|number} [type] - a valid semver string (defaults to patch) or the new version number to use
 * @returns {Promise} Returns a promise that resolves when completed
 * @type {exports}
 */
module.exports = function (type) {
    var localRepo = git(process.cwd()),
        newVersionNum;

    type = type || 'patch';

    if (semver.valid(type)) {
        newVersionNum = type;
    }

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

    var commit = function (version) {
        console.log('committing locally...');
        return new Promise(function (resolve, reject) {
            localRepo.commit(version, function (err) {
                if (err) return reject(err);
                console.log('committing completed!');
                resolve();
            });
        });
    };

    var createTag = function (version) {
        console.log('creating tag...');
        return new Promise(function (resolve, reject) {
            localRepo.createTag(version, function (err) {
                if (err) return reject(err);
                console.log('tag creation completed!');
                resolve();
            });
        });
    };

    var pushTag = function (version) {
        console.log('pushing new tag to remote...');
        return new Promise(function (resolve, reject) {
            localRepo.push('origin', version, function (err) {
                if (err) return reject(err);
                console.log('tag pushed to remote completed!');
                resolve();
            });
        });

    };

    var merge = function (branch, version) {
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
                            return createTag(version).then(function () {
                                return pushTag(version).then(function () {
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

    var bumpFiles = function () {
        if (newVersionNum) {
            return Promise.resolve(newVersionNum);
        } else {
            return bump(type);
        }
    };

    return bumpFiles().then(function (newVersionNbr) {
        return getEditedFiles().then(function (editedFiles) {
            return stageFiles(editedFiles).then(function () {
                return commit(newVersionNbr).then(function () {
                    return merge('master', newVersionNbr);
                });
            });
        });
    }).catch(console.log);
};