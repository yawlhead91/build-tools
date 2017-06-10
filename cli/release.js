"use strict";
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
let log = require('colog');
let cmd = require('node-cmd');
let spawn = require('child_process').spawn;
let Promise = require('bluebird');

const HELPER_TEXT = '\n' +
    '\n' +
    '# Please enter the release notes/changelog message for this release above.\n' +
    '# These lines will be ignored, and an empty message aborts the release.';

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

    let publishToNpm = function (version) {
        return new Promise((resolve) => {
            let cmd = spawn('npm', ['publish']);

            cmd.stdout.on('data', (data) => {
                console.log(`${data}`);
            });

            cmd.stderr.on('data', (data) => {
                console.log(`${data}`);
            });

            cmd.on('close', (code) => {
                if (code !== 0) {
                    log.warning('could not publish to NPM, you will need to run "npm publish" manually')
                } else {
                    log.success(`Published release ${version} to NPM!`);
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
        return new Promise((resolve) => {
            let github = new GitHubApi({
                protocol: "https",
                followRedirects: false, // default: true; there's currently an issue with non-get redirects, so allow ability to disable follow-redirects
                timeout: 5000
            });
            // bail if github config token isn't specified
            if (!githubConfig.token) {
                console.warn('There is no github token set in configuration. Release will not be created on github.');
                return resolve();
            }
            github.authenticate({
                type: 'oauth',
                token: githubConfig.token
            });
            github.repos.createRelease({
                repo: options.user || githubConfig.repo || repoName,
                user: options.user || githubConfig.user,
                tag_name: tagName,
                body: notes,
                draft: options.draft || githubConfig.draft || false,
                prerelease: options.prerelease || githubConfig.prerelease || false
            }, function(err, res) {
                if (err) throw err;
                log.success(`Published release ${tagName} to Github!`);
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

    return runTests()
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
            return version(nextVersion, {commitMessage: releaseNotes}).then(() => {
                return releaseNotes;
            });
        })
        .then((releaseNotes) => {
            let localRepo = githubConfig.repo || git(process.cwd());
            return uploadRelease(localRepo.name, 'v' + nextVersion, releaseNotes);
        })
        .then(() => {
            return publishToNpm(nextVersion);
        })
};
