'use strict';
let sinon = require('sinon');
let mockery = require('mockery');
let bluebird = require('bluebird');
let releasePath = './../cli/release';
let testMock;
let buildMock;
let versionMock;
let utilsMock;
let promptMock;
let bumpMock;
let githubApiMock;
let githubConstructor;
let mockConfig;
let logMock;
let npmPublishMock;
let spawnMock;
let spawnChildProcessMock;
let localRepoMock;
let gitMock;

let allowables = [
    './../../cli/release',
    'bluebird',
    'util',
    './bump',
    'semver'
];

module.exports = {

    setUp: function (cb) {
        mockery.enable({useCleanCache: true});
        mockery.warnOnUnregistered(false); // suppress non-allowed modules
        mockery.registerAllowables(allowables);
        testMock = sinon.stub().returns(Promise.resolve());
        bumpMock = sinon.stub();
        bumpMock.returns(Promise.resolve('0.0.0'));
        mockery.registerMock('./../src/bump', bumpMock);
        buildMock = sinon.stub().returns(Promise.resolve());
        versionMock = sinon.stub().returns(Promise.resolve());
        promptMock = sinon.stub();
        promptMock.returns(Promise.resolve('blah'));
        githubApiMock = {
            authenticate: sinon.stub(),
            repos: {
                createRelease: sinon.stub().yields(null, {})
            },
        };
        githubApiMock.authenticate.returns(true);
        githubConstructor = sinon.stub().returns(githubApiMock);
        mockery.registerMock('github', githubConstructor);
        mockery.registerMock('./../src/test', testMock);
        mockery.registerMock('./../src/prompt', promptMock);
        mockery.registerMock('./../src/build', buildMock);
        logMock = {
            error: sinon.stub(),
            warn: sinon.stub(),
            info: sinon.stub(),
        };
        mockery.registerMock('../log', logMock);
        mockery.registerMock('./../src/version', versionMock);
        spawnChildProcessMock = {
            on: sinon.stub().yields(0),
            stdout: {
                on: sinon.stub()
            },
            stderr: {
                on: sinon.stub()
            }
        };
        spawnMock = sinon.stub();
        spawnMock.returns(spawnChildProcessMock);
        npmPublishMock = spawnMock.withArgs('npm', ['publish']);
        mockery.registerMock('child_process', {
            spawn: spawnMock
        });
        utilsMock = {
            getConfig: sinon.stub()
        };
        mockery.registerMock('./../src/utils', utilsMock);

        localRepoMock = {
            status: sinon.stub(),
            getBranches: sinon.stub(),
            checkout: sinon.stub(),
            merge: sinon.stub(),
            push: sinon.stub(),
            add: sinon.stub(),
            commit: sinon.stub(),
            createTag: sinon.stub(),
            name: 'my-repo'
        };
        gitMock = sinon.stub().returns(localRepoMock);
        mockery.registerMock('gitty', gitMock);
        mockery.registerAllowables(allowables);

        let currentBranch = 'master';
        let statusResp = {
            staged: [],
            unstaged: [],
            untracked: []
        };
        localRepoMock.status.onFirstCall().yields(null, statusResp);
        localRepoMock.status.onSecondCall().yields(null, statusResp);
        localRepoMock.add.yields(null); // staged files success
        localRepoMock.commit.yields(null); // commit success
        let getBranchesResp = {current: currentBranch};
        localRepoMock.getBranches.yields(null, getBranchesResp); // return current branch
        localRepoMock.checkout.yields(null); // checkout success
        localRepoMock.merge.yields(null); // merge success
        localRepoMock.push.yields(null); // push branch success
        localRepoMock.createTag.yields(null); // create tag success
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
        bumpMock.returns(Promise.resolve(null));
        let release = require(releasePath);
        release(['patch']).catch(function (err) {
            test.ok(err);
            test.done();
        });
    },

    'should pass first argument (version type) to bump': function (test) {
        test.expect(1);
        let release = require(releasePath);
        let type = 'patch';
        release([type]).then(function () {
            test.deepEqual(bumpMock.args[0], [type]);
            test.done();
        });
    },

    'should pass production environment build options to build call': function (test) {
        test.expect(6);
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

    'calls github authenticate with appropriate options when a github token is used': function (test) {
        test.expect(2);
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
        bumpMock.returns(Promise.resolve('0.0.6'));
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

    'resolves the promise but does NOT create a release on Github when no github token is present in configuration': function (test) {
        test.expect(2);
        let mockConfig = {
            production: {}
        };
        utilsMock.getConfig.returns(mockConfig);
        let release = require(releasePath);
        release().then(function () {
            test.equal(githubApiMock.repos.createRelease.callCount, 0);
            test.equal(logMock.warn.args[0][1], 'There is no github token set in configuration. Release will not be created on github.');
            test.done();
        });
    },

    'calls npm publish': function (test) {
        test.expect(1);
        let token = 'uebyx';
        mockConfig = {github: {token: token}};
        utilsMock.getConfig.returns(mockConfig);
        let release = require(releasePath);
        release(['patch']).then(function () {
            test.equal(npmPublishMock.callCount, 1);
            test.done();
        });
    },

    'does not create release and shows a warning if no token is used': function (test) {
        test.expect(2);
        let release = require(releasePath);
        release().then(function () {
            test.equal(githubApiMock.repos.createRelease.callCount, 0);
            test.equal(logMock.warn.args[0][1], 'There is no github token set in configuration. Release will not be created on github.');
            test.done();
        });
    },

    'does not create release and does not publish to NPM if a token is used but is not authorized': function (test) {
        test.expect(1);
        let token = 'uebyx';
        mockConfig = {github: {token: token}};
        utilsMock.getConfig.returns(mockConfig);
        githubApiMock.authenticate.returns(false);
        let release = require(releasePath);
        release().catch(function () {
            test.equal(githubApiMock.repos.createRelease.callCount, 0);
            test.done();
        });
    },

    'does not bump the project files if a token is used but is not authorized': function (test) {
        test.expect(1);
        let token = 'uebyx';
        mockConfig = {github: {token: token}};
        utilsMock.getConfig.returns(mockConfig);
        githubApiMock.authenticate.returns(false);
        let release = require(releasePath);
        release().catch(function () {
            test.equal(bumpMock.callCount, 0);
            test.done();
        });
    },

    'does not create a git tag version if a token is used but is not authorized': function (test) {
        test.expect(1);
        let token = 'uebyx';
        mockConfig = {github: {token: token}};
        utilsMock.getConfig.returns(mockConfig);
        githubApiMock.authenticate.returns(false);
        let release = require(releasePath);
        release().catch(function () {
            test.equal(versionMock.callCount, 0);
            test.done();
        });
    },

    'shows an error if a token is used but is not authorized': function (test) {
        test.expect(1);
        let token = 'uebyx';
        mockConfig = {github: {token: token}};
        utilsMock.getConfig.returns(mockConfig);
        githubApiMock.authenticate.returns(false);
        let release = require(releasePath);
        release().catch(function () {
            test.equal(logMock.error.args[0][1], 'The github token used to create the release is not authorized. Please check the github token used.');
            test.done();
        });
    },

    'does not publish to NPM if a token is used but is not authorized': function (test) {
        test.expect(1);
        let token = 'uebyx';
        mockConfig = {github: {token: token}};
        utilsMock.getConfig.returns(mockConfig);
        githubApiMock.authenticate.returns(false);
        let release = require(releasePath);
        release().catch(function () {
            test.equal(npmPublishMock.callCount, 0);
            test.done();
        });
    },

    'rejects promise if npm publish command fails with an error code': function (test) {
        test.expect(1);
        spawnChildProcessMock.on.yields(2);
        let release = require(releasePath);
        release().catch(function () {
            test.ok(true);
            test.done();
        });
    },

    'creates a release and pushes it Github when an authorized token is used': function (test) {
        test.expect(5);
        let token = 'uebyx';
        mockConfig = {
            github: {
                token: token,
                repo: 'myRepo',
                user: 'johnDoe'
            }
        };
        utilsMock.getConfig.returns(mockConfig);
        bumpMock.returns(Promise.resolve('0.0.6'));
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

    'bumps the project files when an authorized token is used': function (test) {
        test.expect(1);
        let token = 'uebyx';
        mockConfig = {github: {token: token}};
        utilsMock.getConfig.returns(mockConfig);
        let release = require(releasePath);
        release().then(function () {
            test.ok(bumpMock.calledWith('patch'));
            test.done();
        });
    },

    'does not publish to NPM if tests fail': function (test) {
        test.expect(1);
        let mockConfig = {
            production: {
                tests: {
                    mocha: {
                        files: ['test-file.js'],
                    }
                }
            }
        };
        utilsMock.getConfig.returns(mockConfig);
        testMock.returns(Promise.reject());
        let release = require(releasePath);
        release().catch(function () {
            test.equal(npmPublishMock.callCount, 0);
            test.done();
        });
    },

    'does not create release notes if tests fail': function (test) {
        test.expect(1);
        let mockConfig = {
            production: {
                tests: {
                    mocha: {
                        files: ['test-file.js'],
                    }
                }
            }
        };
        utilsMock.getConfig.returns(mockConfig);
        testMock.returns(Promise.reject());
        let release = require(releasePath);
        release().catch(function () {
            test.equal(githubApiMock.repos.createRelease.callCount, 0);
            test.done();
        });
    },

    'does not bump the project files if tests fail': function (test) {
        test.expect(1);
        let mockConfig = {
            production: {
                tests: {
                    mocha: {
                        files: ['test-file.js'],
                    }
                }
            }
        };
        utilsMock.getConfig.returns(mockConfig);
        testMock.returns(Promise.reject());
        let release = require(releasePath);
        release().catch(function () {
            test.equal(bumpMock.callCount, 0);
            test.done();
        });
    },

    'does not create a new git tag version if tests fail': function (test) {
        test.expect(1);
        let mockConfig = {
            production: {
                tests: {
                    mocha: {
                        files: ['test-file.js'],
                    }
                }
            }
        };
        utilsMock.getConfig.returns(mockConfig);
        testMock.returns(Promise.reject());
        let release = require(releasePath);
        release().catch(function () {
            test.equal(versionMock.callCount, 0);
            test.done();
        });
    },

    'shows an error message if tests fail': function (test) {
        test.expect(1);
        let mockConfig = {
            production: {
                tests: {
                    mocha: {
                        files: ['test-file.js'],
                    }
                }
            }
        };
        utilsMock.getConfig.returns(mockConfig);
        testMock.returns(Promise.reject());
        let release = require(releasePath);
        release().catch(function () {
            test.equal(logMock.error.args[0][1], 'Release cannot be created due to a test failure.');
            test.done();
        });
    },

    'calling release() designates the current working directory as the repo': function (test) {
        test.expect(1);
        let release = require(releasePath);
        release();
        test.equal(gitMock.args[0][0], process.cwd(), 'git was initialized with current directory as its repo');
        test.done();
    },

    'calling release() with a clean working directory in master bumps version in package.json file, stages it, creates new version tag, and pushes new tag to remote repo': function (test) {
        test.expect(4);
        let versionType = 'minor';
        let newVersionNumber = '0.2.5';
        let currentBranch = 'master';
        let afterBumpStatus = {
            staged: [],
            unstaged: [ { file: 'package.json', status: 'modified' } ],
            untracked: []
        };
        localRepoMock.status.onSecondCall().yields(null, afterBumpStatus); // return status after package.json file has been bumped
        localRepoMock.add.yields(null); // staged files success
        localRepoMock.commit.yields(null); // commit success
        let getBranchesResp = {current: currentBranch};
        localRepoMock.getBranches.yields(null, getBranchesResp); // return current branch
        localRepoMock.checkout.yields(null); // checkout success
        localRepoMock.merge.yields(null); // merge success
        localRepoMock.push.yields(null); // push branch success
        localRepoMock.createTag.yields(null); // create tag success
        bumpMock.returns(Promise.resolve(newVersionNumber));
        let release = require(releasePath);
        release([versionType]).then(function () {
            test.equal(bumpMock.args[0][0], versionType, 'bump was called with correct version type passed');
            test.deepEqual(localRepoMock.add.getCall(0).args[0], ['package.json'], 'bumped file was staged correctly');
            test.ok(localRepoMock.push.getCall(0).calledWith('origin', 'v' + newVersionNumber), 'tag was pushed to correct origin branch');
            test.ok(localRepoMock.push.getCall(1).calledWith('origin', currentBranch), 'branch was pushed to remote');
            test.done();
        });
    },

    'calling release() with a clean working directory a non-master branch bumps version in package.json file, stages it, commits it, merges contents into master, creates new version tag, and pushes new tag to remote repo': function (test) {
        test.expect(8);
        let release = require(releasePath);
        let versionType = 'minor';
        let newVersionNumber = '0.2.5';
        let currentBranch = 'my-branch';
        let productionBranch = 'master';
        let afterBumpStatus = {
            staged: [],
            unstaged: [ { file: 'package.json', status: 'modified' } ],
            untracked: []
        };
        localRepoMock.status.onSecondCall().yields(null, afterBumpStatus); // return status after package.json file has been bumped
        localRepoMock.add.yields(null); // staged files success
        localRepoMock.commit.yields(null); // commit success
        let getBranchesResp = {current: currentBranch};
        localRepoMock.getBranches.yields(null, getBranchesResp); // return current branch
        localRepoMock.checkout.yields(null); // checkout success
        localRepoMock.merge.yields(null); // merge success
        localRepoMock.push.yields(null); // push branch success
        localRepoMock.createTag.yields(null); // create tag success
        bumpMock.returns(Promise.resolve(newVersionNumber));
        let releaseMessage = 'my release worked';
        promptMock.returns(Promise.resolve(releaseMessage));
        release([versionType]).then(function () {
            test.equal(bumpMock.args[0][0], versionType, 'bump was called with correct version type passed');
            test.deepEqual(localRepoMock.add.args[0][0], ['package.json'], 'bumped file was staged correctly');
            test.equal(localRepoMock.commit.args[0][0], `${newVersionNumber}\n\n${releaseMessage}`, 'commit was created using version number for commit title along with release message');
            test.equal(localRepoMock.checkout.args[0][0], productionBranch, 'production branch was checked out');
            test.ok(localRepoMock.push.getCall(0).calledWith('origin', 'v' + newVersionNumber), 'new version tag was pushed to remote');
            test.equal(localRepoMock.push.args[1][0], 'origin', 'production branch was pushed to remote');
            test.equal(localRepoMock.checkout.args[1][0], currentBranch, 'correct branch was checked backed out');
            test.ok(localRepoMock.push.getCall(2).calledWith('origin', currentBranch), 'current branches contents where pushed to remote');
            test.done();
        });
    },

    'prompts user for version commit message': function (test) {
        test.expect(1);
        let release = require(releasePath);
        release().then(function () {
            test.equal(promptMock.callCount, 1);
            test.done();
        });
    },

    'does not attempt to checkout to master or merge into master if already on master branch': function (test) {
        test.expect(2);
        let release = require(releasePath);
        let versionType = 'minor';
        let newVersionNumber = '0.2.5';
        let currentBranch = 'master';
        let afterBumpStatus = {
            staged: [],
            unstaged: [ { file: 'package.json', status: 'modified' } ],
            untracked: []
        };
        localRepoMock.status.onSecondCall().yields(null, afterBumpStatus); // return status after package.json file has been bumped
        localRepoMock.add.yields(null); // staged files success
        localRepoMock.commit.yields(null); // commit success
        let getBranchesResp = {current: currentBranch};
        localRepoMock.getBranches.yields(null, getBranchesResp); // return current branch
        localRepoMock.checkout.yields(null); // checkout success
        localRepoMock.merge.yields(null); // merge success
        localRepoMock.push.yields(null); // push branch success
        localRepoMock.createTag.yields(null); // create tag success
        bumpMock.returns(Promise.resolve(newVersionNumber));
        release([versionType]).then(function () {
            test.ok(localRepoMock.checkout.neverCalledWith('master'));
            test.ok(localRepoMock.merge.neverCalledWith('master'));
            test.done();
        });
    },

};
