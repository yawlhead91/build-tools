"use strict";
var test = require('./../src/test');
var version = require('./../src/version');
var bump = require('./../src/bump');
var build = require('./../src/build');
var fs = require('fs-extra');
var GitHubApi = require('github');
var nopt = require('nopt');
var utils = require('./../src/utils');
var prompt = require('./../src/prompt');
var git = require('gitty');
var log = require('colog');
var cmd = require('node-cmd');
var spawn = require('child_process').spawn;

const HELPER_TEXT = '\n' +
    '\n' +
    '# Please enter the release notes/changelog message for this release above.\n' +
    '# These lines will be ignored, and an empty message aborts the release.';

/**
 * Bumps the package version, runs a build, then commits and pushes updated version.
 * @returns {Promise}
 */
module.exports = function (args) {
    var config = utils.getConfig() || {};
    var githubConfig = config.github || {};
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
    let envConfig = config[env] || {};


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
                resolve(res);
            });
        });
    };


    let nextVersion;
    let testConfig = Object.assign({}, envConfig.tests, {env});
    return test(testConfig)
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
        .then(() => {
            log.success('Published release ' + nextVersion + ' to Github');
        })
};
