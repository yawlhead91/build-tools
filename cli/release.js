let test = require('./../src/test');
let bump = require('./../src/bump');
let build = require('./../src/build');
let fs = require('fs-extra');
let GitHubApi = require('github');
let nopt = require('nopt');
let utils = require('./../src/utils');
let prompt = require('./../src/prompt');
let gitty = require('gitty');
let log = require('../log');
let cmd = require('node-cmd');
let spawn = require('child_process').spawn;
let _ = require('underscore');
let semver = require('semver');
let bluebird = require('bluebird');

const HELPER_TEXT = '\n' +
    '\n' +
    '# Please enter the release notes/changelog message for this release above.\n' +
    '# No need to enter the version number, it will automatically be added to the commit later.\n' +
    '# These lines will be ignored. Erasing all lines (including these ones) will abort the release.';

/**
 * Bumps the package version, runs a build, then commits and pushes updated version.
 * @returns {Promise}
 */
module.exports = function (args) {
    let config = utils.getConfig() || {};
    let githubConfig = config.github || {};
    args = args || [];

    let options = nopt({
        draft: [Boolean, null],
        prerelease: [Boolean, null],
        user: [String, null],
        repo: [String, null],
        token: [String, null]
    }, {}, args, 0);

    let semVersionType = args[0] || 'patch';
    let env = 'production';

    // if there is no production-level config, assume root-level config is production
    let envConfig = config[env] || config || {};
    let repo = gitty(process.cwd());

    let github = new GitHubApi({
        protocol: "https",
        followRedirects: false, // default: true; there's currently an issue with non-get redirects, so allow ability to disable follow-redirects
        timeout: 5000
    });

    let publishToNpm = function (version) {
        let cmd = spawn('npm', ['publish']);
        return new Promise((resolve, reject) => {

            cmd.stdout.on('data', (data) => {
                log.info(`${data}`);
            });

            cmd.stderr.on('data', (data) => {
                log.info(`${data}`);
            });

            cmd.on('close', (code) => {
                if (code !== 0) {
                    let error = new Error(`Couldn't publish to NPM due to a conflict or error. You'll now have to fix conflicts and run "npm publish" manually, sorry.`);
                    reject(error);
                } else {
                    log.info('publish', `Published release ${version} to NPM!`);
                    resolve();
                }
            });
        });
    };

    let uploadRelease = function (repoName, tagName, notes) {
        let noteFrags = notes.split('\n');
        if (noteFrags[0].trim() === tagName) {
            notes = notes.split(noteFrags[0])[1];
        }
        return new Promise((resolve, reject) => {
            github.repos.createRelease({
                repo: options.user || githubConfig.repo || repoName,
                user: options.user || githubConfig.user,
                tag_name: tagName,
                body: notes,
                draft: options.draft || githubConfig.draft || false,
                prerelease: options.prerelease || githubConfig.prerelease || false
            }, function(err, res) {
                if (err) {
                    reject(err);
                }
                log.info('publish', `Published release ${tagName} to Github!`);
                resolve(res);
            });
        });
    };

    let commit = function (message) {
        log.info('commit', 'committing locally...');
        return new Promise(function (resolve, reject) {
            repo.commit(message, function (err) {
                if (err) {return reject(err);}
                log.info('commit', 'committing completed!');
                resolve();
            });
        });
    };

    let createTag = function (version) {
        log.info('commit', 'creating tag...');
        return new Promise(function (resolve, reject) {
            repo.createTag(version, function (err) {
                if (err) {return reject(err);}
                log.info('commit', 'tag creation completed!');
                resolve();
            });
        });
    };

    let pushTag = function (version) {
        log.info('push', 'pushing new tag to remote...');
        return new Promise(function (resolve, reject) {
            repo.push('origin', version, function (err) {
                if (err) {return reject(err);}
                log.info('push', 'tag pushed to remote completed!');
                resolve();
            });
        });
    };

    let merge = function (branch, version) {
        log.info('checkout', 'attempting to merge new version into ' + branch + '...');
        return new Promise(function (resolve, reject) {
            repo.getBranches(function (err, branches) {
                if (err) {return reject(err);}
                log.info('checkout', `checking out ${branch}...`);
                repo.checkout(branch, function (err) {
                    if (err) {return reject(err);}
                    log.info('merge', `merging ${branches.current} into ${branch}...`);
                    repo.merge(branches.current, function (err) {
                        if (err) {return reject(err);}
                        log.info('push', `pushing contents of ${branch} to remote...`);
                        repo.push('origin', branch, function (err) {
                            if (err) {return reject(err);}
                            resolve();
                        });
                    });
                });
            });
        });
    };

    let getBumpedUnstagedFiles = function () {
        let files = [];
        return new Promise(function (resolve, reject) {
            repo.status(function (err, status) {
                if (err) {return reject(err);}
                // only return unstaged files because that should
                // be the only thing that was modified due to bumping
                status.unstaged.forEach(function (obj) {
                    files.push(obj.file);
                });
                resolve(files);
            });
        });
    };

    let stageBumpedFiles = function (files) {
        log.info('commit', 'staging files...');
        return new Promise(function (resolve, reject) {
            repo.add(files, function (err) {
                if (err) {return reject(err);}
                log.info('commit', 'staging files completed!');
                resolve();
            });
        });
    };

    let ensureCleanWorkingDirectory = function () {
        return new Promise(function (resolve, reject) {
            repo.status(function (err, status) {
                if (err) {
                    return reject(err);
                }
                if (status && !status.staged.length && !status.unstaged.length && !status.untracked.length) {
                    resolve();
                } else {
                    // working directory is dirty! so bail
                    let err = new Error ('Your working directory must be clean before you ' +
                        'can create a new release of your package');
                    reject(err);
                }
            });
        });
    };

    let runTests = function () {
        let testConfigs = envConfig.tests || [];
        if (!Array.isArray(testConfigs)) {
            testConfigs = [testConfigs];
        }
        return bluebird.mapSeries(testConfigs, (testConfig) => {
            let testIds = Object.keys(testConfig);
            return bluebird.mapSeries(testIds, (testId) => {
                let options = testConfig[testId];
                options.browserifyOptions = options.browserifyOptions || testConfig.browserifyOptions;
                options.id = testId;
                options.env = env;
                return test(options);
            });
        }).catch((err) => {
            err = new Error('Release cannot be created due to a test failure.');
            return Promise.reject(err);
        });
    };

    let release = {};
    return ensureCleanWorkingDirectory()
        .then(() => runTests())
        .then(() => {
            if (!githubConfig.token) {
                log.warn('', 'There is no github token set in configuration. Release will not be created on github.');
                return;
            }
            release.authenticated = github.authenticate({
                type: 'oauth',
                token: githubConfig.token
            });
            if (!release.authenticated) {
                throw new Error('The github token used to create the release is not authorized. Please check the github token used.');
            }
        })
        .then(() => bump(semVersionType))
        .then(function (version) {
            if (!version) {
                throw new Error('Cannot bump you must have a version number specified in your package.json file');
            } else {
                release.version = version;
                release.tag = `v${version}`;
            }
        })
        .then(() => {
            let buildConfig = Object.assign({}, envConfig.build, {
                env: env
            });
            return build(buildConfig);
        })
        .then(() => prompt({guidanceText: HELPER_TEXT}))
        .then((releaseNotes) => {
            if (!releaseNotes || !releaseNotes.trim()) {
                let err = new Error('Release aborted.');
                err.abort = true;
                throw err;
            }
            release.notes = releaseNotes;
        })
        .then(() => getBumpedUnstagedFiles())
        .then((files) => {
            return stageBumpedFiles(files);
        })
        .then(() => {
            if (release.notes) {
                release.notes = '\n\n' + release.notes;
            }
            release.notes = release.version + release.notes;
            return commit(release.notes);
        })
        .then(() => createTag(release.tag))
        .then(() => pushTag(release.tag))
        .then(function () {
            return bluebird.promisify(repo.getBranches)().then((branches) => {
                // if user didn't start the release on production branch
                // switch to it, merge contents there, then switch back to original branch
                if (branches.current !== 'master') {
                    return merge('master', release.tag).then(() => {
                        return bluebird.promisify(repo.checkout)(branches.current).then(() => {
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
            return bluebird.promisify(repo.push)('origin', branches.current).then(() => {
                log.info('push', `pushing contents of current branch (${branches.current}) to remote!`);
            });
        })
        .then(() => {
            if (githubConfig.token && release.authenticated) {
                return uploadRelease(repo.name, 'v' + release.version, release.notes);
            }
        })
        .then(() => publishToNpm(release.version))
        .catch((err) => {
            if (err.abort) {
                log.info('', err.message);
            } else {
                log.error('', err.message);
                throw err;
            }
        });
};
