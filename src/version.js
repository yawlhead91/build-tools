let git = require('gitty');
let bump = require('./bump');
let _ = require('underscore');
let semver = require('semver');
let prompt = require('./prompt');
let log = require('npmlog');
let bluebird = require('bluebird');

/**
 * Ups the current package to a new version, prompts user for commit message, then makes a commit locally.
 * @param {string} [versionType] - a valid semver type (defaults to patch)
 * @param {Object} [options] - Set of options
 * @param {String} [options.commitMessage] -- If not specified, will prompt user for commit message
 * @returns {Promise} Returns a promise that resolves when completed
 * @type {exports}
 */
module.exports = function (versionType, options = {}) {
    let localRepo = git(process.cwd());

    versionType = versionType || 'patch';

    options.commitMessage = options.commitMessage || '';

    let getEditedFiles = function () {
        let files = [];
        return new Promise(function (resolve, reject) {
            localRepo.status(function (err, status) {
                if (err) {return reject(err);}
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
        log.info('commit', 'staging files...');
        return new Promise(function (resolve, reject) {
            localRepo.add(files, function (err) {
                if (err) {return reject(err);}
                log.info('commit', 'staging files completed!');
                resolve();
            });
        });
    };

    let commit = function (message) {
        log.info('commit', 'committing locally...');
        return new Promise(function (resolve, reject) {
            localRepo.commit(message, function (err) {
                if (err) {return reject(err);}
                log.info('commit', 'committing completed!');
                resolve();
            });
        });
    };

    let createTag = function (version) {
        log.info('commit', 'creating tag...');
        return new Promise(function (resolve, reject) {
            localRepo.createTag(version, function (err) {
                if (err) {return reject(err);}
                log.info('commit', 'tag creation completed!');
                resolve();
            });
        });
    };

    let pushTag = function (version) {
        log.info('push', 'pushing new tag to remote...');
        return new Promise(function (resolve, reject) {
            localRepo.push('origin', version, function (err) {
                if (err) {return reject(err);}
                log.info('push', 'tag pushed to remote completed!');
                resolve();
            });
        });
    };

    let merge = function (branch, version) {
        log.info('checkout', 'attempting to merge new version into ' + branch + '...');
        return new Promise(function (resolve, reject) {
            localRepo.getBranches(function (err, branches) {
                if (err) {return reject(err);}
                log.info('checkout', `checking out ${branch}...`);
                localRepo.checkout(branch, function (err) {
                    if (err) {return reject(err);}
                    log.info('merge', `merging ${branches.current} into ${branch}...`);
                    localRepo.merge(branches.current, function (err) {
                        if (err) {return reject(err);}
                        log.info('push', `pushing contents of ${branch} to remote...`);
                        localRepo.push('origin', branch, function (err) {
                            if (err) {return reject(err);}
                            resolve();
                        });
                    });
                });
            });
        });
    };

    let tagNumber;
    let newVersionNum;
    return bump(versionType)
        .then(function (version) {
            tagNumber = 'v' + version;
            newVersionNum = version;
            return getEditedFiles();
        })
        .then(function (editedFiles) {
            return stageFiles(editedFiles);
        })
        .then(function () {
            if (options.commitMessage) {
                return options.commitMessage;
            }
            return prompt({defaultText: ''});
        })
        .then((commitMessage) => {
            if (commitMessage) {
                commitMessage = '\n\n' + commitMessage;
            }
            commitMessage = newVersionNum + commitMessage;
            return commit(commitMessage);
        })
        .then(() => {
            return createTag(tagNumber);
        })
        .then(() => {
            return pushTag(tagNumber);
        })
        .then(function () {
            return bluebird.promisify(localRepo.getBranches)().then((branches) => {
                // if user didn't start the release on production branch
                // switch to it, merge contents there, then switch back to original branch
                if (branches.current !== 'master') {
                    return merge('master', tagNumber).then(() => {
                        return bluebird.promisify(localRepo.checkout)(branches.current).then(() => {
                            log.info('checkout', 'switched back to original branch');
                            return branches;
                        });
                    });
                }
                return branches;
            });
        })
        .then((branches) => {
            // push original branch contents to github
            return bluebird.promisify(localRepo.push)('origin', branches.current).then(() => {
                log.info('push', `pushing contents of current branch (${branches.current}) to remote!`);
            });
        })
        .catch((err) => log.error('', err));
};
