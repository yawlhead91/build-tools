'use strict';
let sinon = require('sinon');
let mockery = require('mockery');
let Promise = require('bluebird');
let releasePath = './../cli/release';
let testMock;
let buildMock;
let versionMock;
let utilsMock;
let promptMock;
let promptMockPromise;
let bumpMock;
let bumpMockPromise;
let githubApiMock;
let githubConstructor;
let mockConfig;
let cologMock;
let spawnMock;
let spawnChildProcessMock;
let allowables = [
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
        let testFiles = ['testo.js'];
        let mockConfig = {
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
        let release = require(releasePath);
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
        let testFiles = ['testo.js'];
        let qunitTestFiles = ['qunit-test.js'];
        let mockConfig = {
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
        let release = require(releasePath);
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
        let release = require(releasePath);
        release(['patch']).catch(function (err) {
            test.ok(err);
            test.done();
        });
    },

    'should pass first argument (version type) to bump': function (test) {
        test.expect(1);
        bumpMockPromise.resolve('0.0.5');
        promptMockPromise.resolve('');
        let release = require(releasePath);
        let type = 'patch';
        release([type]).then(function () {
            test.deepEqual(bumpMock.args[0], [type]);
            test.done();
        });
    },

    'should pass production environment build options to build call': function (test) {
        test.expect(6);
        bumpMockPromise.resolve('0.0.5');
        promptMockPromise.resolve('');
        let buildFiles = ['testo.js'];
        let requires = {'my': 'file.js'};
        let exclude = ['exclude.file.js'];
        let ignore = ['ignored.js'];
        let mockConfig = {
            production: {
                build: {
                    files: buildFiles,
                    requires: requires,
                    exclude: exclude,
                    ignore: ignore,
                }
            }
        };
        utilsMock.getConfig.returns(mockConfig);
        let release = require(releasePath);
        release().then(function () {
            let assertedBuildOptions = buildMock.args[0][0];
            test.equal(assertedBuildOptions.env, 'production');
            test.ok(!assertedBuildOptions.test);
            test.deepEqual(assertedBuildOptions.files, buildFiles);
            test.deepEqual(assertedBuildOptions.requires, requires);
            test.deepEqual(assertedBuildOptions.exclude, exclude);
            test.deepEqual(assertedBuildOptions.ignore, ignore);
            test.done();
        });
    },

    'should pass appropriate root-level environment options to build if there is no production level options': function (test) {
        test.expect(2);
        bumpMockPromise.resolve('0.0.5');
        promptMockPromise.resolve('');
        let buildFiles = ['testo.js'];
        let mockConfig = {
            build: {
                files: buildFiles,
            }
        };
        utilsMock.getConfig.returns(mockConfig);
        let release = require(releasePath);
        release().then(function () {
            let assertedBuildOptions = buildMock.args[0][0];
            test.equal(assertedBuildOptions.env, 'production');
            test.deepEqual(assertedBuildOptions.files, buildFiles);
            test.done();
        });
    },

    'should pass appropriate root-level config test options to test process if there is no production level config': function (test) {
        test.expect(2);
        bumpMockPromise.resolve('0.0.5');
        promptMockPromise.resolve('');
        let testFiles = ['testo.js'];
        let mockConfig = {
            tests: {
                mocha: {
                    files: testFiles,
                }
            }
        };
        utilsMock.getConfig.returns(mockConfig);
        let release = require(releasePath);
        release().then(function () {
            let assertedTestOptions = testMock.args[0][0];
            test.equal(assertedTestOptions.id, 'mocha');
            test.deepEqual(assertedTestOptions.files, testFiles);
            test.done();
        });
    },

    'should pass appropriate root-level config browserify options to test process if browserify options are at the tests level': function (test) {
        test.expect(1);
        bumpMockPromise.resolve('0.0.5');
        promptMockPromise.resolve('');
        let browserifyOptions = {
            transform: [{my: 'transform'}],
            require: {}
        };
        let mockConfig = {
            tests: {
                mocha: {},
                browserifyOptions
            }
        };
        utilsMock.getConfig.returns(mockConfig);
        let release = require(releasePath);
        release().then(function () {
            test.deepEqual(testMock.args[0][0].browserifyOptions, browserifyOptions);
            test.done();
        });
    },

    'should pass appropriate root-level config browserify options to test process if browserify options are at the test-type level': function (test) {
        test.expect(1);
        bumpMockPromise.resolve('0.0.5');
        promptMockPromise.resolve('');
        let browserifyOptions = {
            transform: [{my: 'transform'}],
            require: {}
        };
        let mockConfig = {
            tests: {
                mocha: {
                    browserifyOptions
                },
            }
        };
        utilsMock.getConfig.returns(mockConfig);
        let release = require(releasePath);
        release().then(function () {
            test.deepEqual(testMock.args[0][0].browserifyOptions, browserifyOptions);
            test.done();
        });
    },

    'should pass appropriate production level config browserify options to test process if browserify options are at the tests level': function (test) {
        test.expect(1);
        bumpMockPromise.resolve('0.0.5');
        promptMockPromise.resolve('');
        let browserifyOptions = {
            transform: [{my: 'transform'}],
            require: {}
        };
        let mockConfig = {
            production: {
                tests: {
                    mocha: {},
                    browserifyOptions
                }
            }
        };
        utilsMock.getConfig.returns(mockConfig);
        let release = require(releasePath);
        release().then(function () {
            test.deepEqual(testMock.args[0][0].browserifyOptions, browserifyOptions);
            test.done();
        });
    },

    'should pass appropriate production config browserify options to test process if browserify options are at the test-type level': function (test) {
        test.expect(1);
        bumpMockPromise.resolve('0.0.5');
        promptMockPromise.resolve('');
        let browserifyOptions = {
            transform: [{my: 'transform'}],
            require: {}
        };
        let mockConfig = {
            production: {
                tests: {
                    mocha: {
                        browserifyOptions
                    },
                }
            }
        };
        utilsMock.getConfig.returns(mockConfig);
        let release = require(releasePath);
        release().then(function () {
            test.deepEqual(testMock.args[0][0].browserifyOptions, browserifyOptions);
            test.done();
        });
    },

    'should pass updated version number from bump to version function': function (test) {
        test.expect(1);
        let newVersionNbr = "9.95.0";
        promptMockPromise.resolve('');
        bumpMockPromise.resolve(newVersionNbr);
        let release = require(releasePath);
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
        let release = require(releasePath);
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
        let release = require(releasePath);
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
        let release = require(releasePath);
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
        let mockConfig = {
            production: {}
        };
        utilsMock.getConfig.returns(mockConfig);
        let release = require(releasePath);
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
        let release = require(releasePath);
        release(['patch']).then(function () {
            test.equal(spawnMock.args[0][0], 'npm');
            test.deepEqual(spawnMock.args[0][1], ['publish']);
            test.done();
        });
    },


};
