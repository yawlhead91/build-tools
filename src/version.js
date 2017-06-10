'use strict';
let git = require('gitty');
let Promise = require('promise');
let bump = require('./bump');
let _ = require('underscore');
let semver = require('semver');
let prompt = require('./prompt');

/**
 * Ups the current package to a new version, prompts user for commit message, then makes a commit locally.
 * @param {string|number} [type] - a valid semver string (defaults to patch) or the new version number to use
 * @param {Object} [options] - Set of options
 * @param {String} [options.commitMessage] -- If not specified, will prompt user for commit message
 * @returns {Promise} Returns a promise that resolves when completed
 * @type {exports}
 */
module.exports = function (type, options={}) {
    let localRepo = git(process.cwd()),
        newVersionNum;

    type = type || 'patch';

    if (semver.valid(type)) {
        newVersionNum = type;
    }

    options.commitMessage = options.commitMessage || '';

    let getEditedFiles = function () {
        let files = [];
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

    let stageFiles = function (files) {
        console.log('staging files...');
        return new Promise(function (resolve, reject) {
            localRepo.add(files, function (err) {
                if (err) return reject(err);
                console.log('staging files completed!');
                resolve();
            });
        });
    };

    let commit = function (message) {
        console.log('committing locally...');
        return new Promise(function (resolve, reject) {
            localRepo.commit(message, function (err) {
                if (err) return reject(err);
                console.log('committing completed!');
                resolve();
            });
        });
    };

    let createTag = function (version) {
        console.log('creating tag...');
        return new Promise(function (resolve, reject) {
            localRepo.createTag(version, function (err) {
                if (err) return reject(err);
                console.log('tag creation completed!');
                resolve();
            });
        });
    };

    let pushTag = function (version) {
        console.log('pushing new tag to remote...');
        return new Promise(function (resolve, reject) {
            localRepo.push('origin', version, function (err) {
                if (err) return reject(err);
                console.log('tag pushed to remote completed!');
                resolve();
            });
        });
    };

    let merge = function (branch, version) {
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
                        })
                    });
                });
            });
        });
    };

    let bumpFiles = function () {
        if (newVersionNum) {
            return Promise.resolve(newVersionNum);
        } else {
            return bump(type);
        }
    };

    let tagNumber;
    return bumpFiles()
        .then(function (newVersionNbr) {
            tagNumber = 'v' + newVersionNbr;
            return getEditedFiles();
        })
        .then(function (editedFiles) {
            return stageFiles(editedFiles)
        })
        .then(function () {
            if (options.commitMessage) {
                return options.commitMessage;
            }
            return prompt({defaultText: tagNumber})
        })
        .then((commitMessage) => {
            commitMessage = commitMessage || tagNumber;
            let frags = commitMessage.split('\n');
            if (frags[0].trim() !== tagNumber) {
                commitMessage = tagNumber + '\n\n' + commitMessage;
            }
            return commit(commitMessage)
        })
        .then(() => {
            return createTag(tagNumber);
        })
        .then(() => {
            return pushTag(tagNumber);
        })
        .then(function () {
            return merge('master', tagNumber);
        })
        .catch(console.log);
};
