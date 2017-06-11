let test = require('./../src/test');
let version = require('./../src/version');
let bump = require('./../src/bump');
let build = require('./../src/build');
let fs = require('fs-extra');
let GitHubApi = require('github');
let nopt = require('nopt');
let utils = require('./../src/utils');
let prompt = require('./../src/prompt');
let git = require('gitty');
let log = require('../log');
let cmd = require('node-cmd');
let spawn = require('child_process').spawn;
let Promise = require('bluebird');

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

    let github = new GitHubApi({
        protocol: "https",
        followRedirects: false, // default: true; there's currently an issue with non-get redirects, so allow ability to disable follow-redirects
        timeout: 5000
    });

    let publishToNpm = function (version) {
        return new Promise((resolve) => {
            let cmd = spawn('npm', ['publish']);

            cmd.stdout.on('data', (data) => {
                log.info(`${data}`);
            });

            cmd.stderr.on('data', (data) => {
                log.info(`${data}`);
            });

            cmd.on('close', (code) => {
                if (code !== 0) {
                    log.error('', `Couldn't publish to NPM due to a conflict or error. You'll now have to fix conflicts and run "npm publish" manually, sorry.`)
                } else {
                    log.info('', `Published release ${version} to NPM!`);
                }
                resolve();
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
                log.info('', `Published release ${tagName} to Github!`);
                resolve(res);
            });
        });
    };


    let nextVersion;
    let runTests = function () {
        let testConfigs = envConfig.tests || [];
        if (!Array.isArray(testConfigs)) {
            testConfigs = [testConfigs];
        }
        return Promise.mapSeries(testConfigs, (testConfig) => {
            let testIds = Object.keys(testConfig);
            return Promise.mapSeries(testIds, (testId) => {
                let options = testConfig[testId];
                options.browserifyOptions = options.browserifyOptions || testConfig.browserifyOptions;
                options.id = testId;
                options.env = env;
                return test(options);
            });
        });
    };

    let githubAuthenticated = false;
    return runTests()
        .catch((err) => {
            err = new Error('Release cannot be created due to a test failure.');
            log.error('', err.message);
            throw err;
        })
        .then(() => {
            if (!githubConfig.token) {
                log.warn('', 'There is no github token set in configuration. Release will not be created on github.');
                return;
            }
            githubAuthenticated = github.authenticate({
                type: 'oauth',
                token: githubConfig.token
            });
            if (!githubAuthenticated) {
                throw new Error('The github token used to create the release is not authorized. Please check the github token used.');
            }
        })
        .then(function () {
            return bump(semVersionType);
        })
        .then(function (version) {
            if (!version) {
                throw new Error('Cannot bump you must have a version number specified in your package.json file');
            } else {
                nextVersion = version;
            }
        })
        .then(() => {
            let buildConfig = Object.assign({}, envConfig.build, {
                env: env
            });
            return build(buildConfig);
        })
        .then(() => {
            return prompt({guidanceText: HELPER_TEXT});
        })
        .then((releaseNotes) => {
            if (!releaseNotes || !releaseNotes.trim()) {
                let err = new Error('Release aborted.');
                err.abort = true;
                throw err;
            }
            return version(nextVersion, {commitMessage: releaseNotes}).then(() => {
                return releaseNotes;
            });
        })
        .then((releaseNotes) => {
            if (githubConfig.token && githubAuthenticated) {
                let localRepo = githubConfig.repo || git(process.cwd());
                return uploadRelease(localRepo.name, 'v' + nextVersion, releaseNotes);
            }
        })
        .then(() => {
            return publishToNpm(nextVersion);
        })
        .catch((err) => {
            if (err.abort) {
                log.info('', err.message);
            } else {
                log.error('', err.message);
                throw err;
            }
        });
};
