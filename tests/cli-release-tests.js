'use strict';
var sinon = require('sinon');
var mockery = require('mockery');
var Promise = require('bluebird');
var releasePath = './../cli/release';
var testMock;
var buildMock;
var versionMock;
var utilsMock;
var promptMock;
var promptMockPromise;
var bumpMock;
var bumpMockPromise;
var githubApiMock;
var githubConstructor;
var mockConfig;
var cologMock;
var spawnMock;
var spawnChildProcessMock;
var allowables = [
    './../../cli/release',
    'bluebird'
];

function createPromise () {
    let obj = {};
    obj.promise = new Promise((resolve, reject) => {
        obj.resolve = resolve;
        obj.reject = reject;
    });
    return obj;
}

module.exports = {

    setUp: function (cb) {
        mockery.enable({useCleanCache: true});
        mockery.warnOnUnregistered(false); // suppress non-allowed modules
        mockery.registerAllowables(allowables);
        testMock = sinon.stub().returns(Promise.resolve());
        bumpMockPromise = createPromise();
        bumpMock = sinon.stub().returns(bumpMockPromise.promise);
        mockery.registerMock('./../src/bump', bumpMock);
        buildMock = sinon.stub().returns(Promise.resolve());
        versionMock = sinon.stub().returns(Promise.resolve());
        promptMockPromise = createPromise();
        promptMock = sinon.stub().returns(promptMockPromise.promise);
        githubApiMock = {
            authenticate: sinon.stub(),
            repos: {
                createRelease: sinon.stub().yields(null, {})
            }
        };
        githubConstructor = sinon.stub().returns(githubApiMock);
        mockery.registerMock('github', githubConstructor);
        mockery.registerMock('./../src/test', testMock);
        mockery.registerMock('./../src/prompt', promptMock);
        mockery.registerMock('./../src/build', buildMock);
        cologMock = {
            success: sinon.stub(),
            warning: sinon.stub()
        };
        mockery.registerMock('colog', cologMock);
        mockery.registerMock('./../src/version', versionMock);
        spawnChildProcessMock = {
            on: sinon.stub().yields(),
            stdout: {
                on: sinon.stub()
            },
            stderr: {
                on: sinon.stub()
            }
        };
        spawnMock = sinon.stub().returns(spawnChildProcessMock);
        mockery.registerMock('child_process', {
            spawn: spawnMock
        });
        utilsMock = {
            getConfig: sinon.stub()
        };
        mockery.registerMock('./../src/utils', utilsMock);
        cb();
    },

    tearDown: function (cb) {
        mockery.deregisterAll();
        mockery.disable();
        cb();
    },

    'should run tests if there is a production level test configuration': function (test) {
        test.expect(3);
        var testFiles = ['testo.js'];
        var mockConfig = {
            production: {
                tests: {
                    mocha: {
                        files: testFiles,
                    }
                }
            }
        };
        utilsMock.getConfig.returns(mockConfig);
        bumpMockPromise.resolve('0.0.5');
        promptMockPromise.resolve('');
        var release = require(releasePath);
        release(['patch']).then(function () {
            let assertedTestOptions = testMock.args[0][0];
            test.equal(assertedTestOptions.env, 'production');
            test.equal(assertedTestOptions.id, 'mocha');
            test.deepEqual(assertedTestOptions.files, testFiles);
            test.done();
        });
    },

    'should run multiple tests if they are multiple test configurations in production level configuration': function (test) {
        test.expect(6);
        var testFiles = ['testo.js'];
        var qunitTestFiles = ['qunit-test.js'];
        var mockConfig = {
            production: {
                tests: [
                    {
                        mocha: {
                            files: testFiles,
                        }
                    },
                    {
                        qunit: {
                            files: qunitTestFiles,
                        }
                    }
                ]
            }
        };
        utilsMock.getConfig.returns(mockConfig);
        bumpMockPromise.resolve('0.0.5');
        promptMockPromise.resolve('');
        var release = require(releasePath);
        release(['patch']).then(function () {
            let firstAssertedTestOptions = testMock.args[0][0];
            test.equal(firstAssertedTestOptions.env, 'production');
            test.equal(firstAssertedTestOptions.id, 'mocha');
            test.deepEqual(firstAssertedTestOptions.files, testFiles);
            let secondAssertedTestOptions = testMock.args[1][0];
            test.equal(secondAssertedTestOptions.env, 'production');
            test.equal(secondAssertedTestOptions.id, 'qunit');
            test.deepEqual(secondAssertedTestOptions.files, qunitTestFiles);
            test.done();
        });
    },

    'throws an error when bump returns no new version': function (test) {
        test.expect(1);
        bumpMockPromise.resolve(null);
        promptMockPromise.resolve('');
        var release = require(releasePath);
        release(['patch']).catch(function (err) {
            test.ok(err);
            test.done();
        });
    },

    'should pass first argument (version type) to bump': function (test) {
        test.expect(1);
        bumpMockPromise.resolve('0.0.5');
        promptMockPromise.resolve('');
        var release = require(releasePath);
        var type = 'patch';
        release([type]).then(function () {
            test.deepEqual(bumpMock.args[0], [type]);
            test.done();
        });
    },

    'should pass appropriate options to build': function (test) {
        test.expect(6);
        bumpMockPromise.resolve('0.0.5');
        promptMockPromise.resolve('');
        var testFiles = ['testo.js'];
        var requires = {'my': 'file.js'};
        var exclude = ['exclude.file.js'];
        var ignore = ['ignored.js'];
        var mockConfig = {
            production: {
                build: {
                    files: testFiles,
                    requires: requires,
                    exclude: exclude,
                    ignore: ignore,
                }
            }
        };
        utilsMock.getConfig.returns(mockConfig);
        var release = require(releasePath);
        release().then(function () {
            var assertedBuildOptions = buildMock.args[0][0];
            test.equal(assertedBuildOptions.env, 'production');
            test.ok(!assertedBuildOptions.test);
            test.deepEqual(assertedBuildOptions.files, testFiles);
            test.deepEqual(assertedBuildOptions.requires, requires);
            test.deepEqual(assertedBuildOptions.exclude, exclude);
            test.deepEqual(assertedBuildOptions.ignore, ignore);
            test.done();
        });
    },

    'should pass updated version number from bump to version function': function (test) {
        test.expect(1);
        var newVersionNbr = "9.95.0";
        promptMockPromise.resolve('');
        bumpMockPromise.resolve(newVersionNbr);
        var release = require(releasePath);
        release().then(function () {
            test.deepEqual(versionMock.args[0][0], newVersionNbr);
            test.done();
        });
    },

    'should pass correct commit message from release notes in prompt to version function': function (test) {
        test.expect(1);
        bumpMockPromise.resolve('0.0.5');
        let testNotes = 'blah';
        promptMockPromise.resolve(testNotes);
        var release = require(releasePath);
        release().then(function () {
            test.deepEqual(versionMock.args[0][1].commitMessage, testNotes);
            test.done();
        });
    },

    'calls github authenticate with appropriate options': function (test) {
        test.expect(2);
        bumpMockPromise.resolve('0.0.6');
        promptMockPromise.resolve('');
        let token = 'uebyx';
        mockConfig = {github: {token: token}};
        utilsMock.getConfig.returns(mockConfig);
        var release = require(releasePath);
        release(['patch']).then(function () {
            test.equal(githubApiMock.authenticate.args[0][0].type, 'oauth');
            test.equal(githubApiMock.authenticate.args[0][0].token, token);
            test.done();
        });
    },

    'uploads a release with correct options when github token is specified in configuration': function (test) {
        test.expect(5);
        bumpMockPromise.resolve('0.0.6');
        promptMockPromise.resolve('');
        let token = 'uebyx';
        mockConfig = {
            github: {
                token: token,
                repo: 'myRepo',
                user: 'johnDoe'
            }
        };
        utilsMock.getConfig.returns(mockConfig);
        var release = require(releasePath);
        release().then(function () {
            let assertedCreateReleaseOptions = githubApiMock.repos.createRelease.args[0][0];
            test.equal(assertedCreateReleaseOptions.repo, 'myRepo');
            test.equal(assertedCreateReleaseOptions.user, 'johnDoe');
            test.equal(assertedCreateReleaseOptions.tag_name, 'v0.0.6');
            test.equal(assertedCreateReleaseOptions.draft, false);
            test.equal(assertedCreateReleaseOptions.prerelease, false);
            test.done();
        });
    },

    'does NOT create a release when no github token is present in configuration': function (test) {
        test.expect(1);
        bumpMockPromise.resolve('0.0.6');
        promptMockPromise.resolve('');
        var mockConfig = {
            production: {}
        };
        utilsMock.getConfig.returns(mockConfig);
        var release = require(releasePath);
        release().then(function () {
            test.equal(githubApiMock.repos.createRelease.callCount, 0);
            test.done();
        });
    },

    'calls npm publish': function (test) {
        test.expect(2);
        bumpMockPromise.resolve('0.0.6');
        promptMockPromise.resolve('');
        let token = 'uebyx';
        mockConfig = {github: {token: token}};
        mockery.registerMock(process.cwd() + '/bt-config', mockConfig);
        var release = require(releasePath);
        release(['patch']).then(function () {
            test.equal(spawnMock.args[0][0], 'npm');
            test.deepEqual(spawnMock.args[0][1], ['publish']);
            test.done();
        });
    },


};
