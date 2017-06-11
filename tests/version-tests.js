'use strict';
let testPath = './../src/version';
let mockery = require('mockery');
let sinon = require('sinon');
let Promise = require('promise');

let gitMock;
let localRepoMock;
let bumpStub;
let promptMock;
let bumpStubPromise;

let allowables = ['util', testPath, 'promise', './bump', 'semver'];

module.exports = {

    setUp: function (cb) {
        mockery.enable({useCleanCache: true});
        mockery.warnOnUnregistered(false); // suppress non-allowed modules
        localRepoMock = {
            status: sinon.stub(),
            getBranches: sinon.stub(),
            checkout: sinon.stub(),
            merge: sinon.stub(),
            push: sinon.stub(),
            add: sinon.stub(),
            commit: sinon.stub(),
            createTag: sinon.stub()
        };
        gitMock = sinon.stub().returns(localRepoMock);
        mockery.registerMock('gitty', gitMock);
        promptMock = sinon.stub();
        promptMock.returns(Promise.resolve(''));
        mockery.registerMock('./prompt', promptMock);
        bumpStubPromise = {};
        bumpStub = sinon.stub().returns(new Promise((resolve, reject) => {
            bumpStubPromise.resolve = resolve;
            bumpStubPromise.reject = reject;
        }));
        mockery.registerMock('./bump', bumpStub);
        mockery.registerAllowables(allowables);

        let versionType = 'minor';
        let currentBranch = 'master';
        let statusResp = {
            staged: [],
            unstaged: [],
            untracked: []
        };
        localRepoMock.status.onFirstCall().yields(null, statusResp);
        localRepoMock.add.yields(null); // staged files success
        localRepoMock.commit.yields(null); // commit success
        let getBranchesResp = {current: currentBranch};
        localRepoMock.getBranches.yields(null, getBranchesResp); // return current branch
        localRepoMock.checkout.yields(null); // checkout success
        localRepoMock.merge.yields(null); // merge success
        localRepoMock.push.yields(null); // push branch success
        localRepoMock.createTag.yields(null); // create tag success

        sinon.stub(console, 'log');
        sinon.stub(console, 'error');
        cb();
    },

    tearDown: function (cb) {
        console.log.restore();
        console.error.restore();
        mockery.deregisterAll('gitty');
        mockery.deregisterAllowables(allowables);
        mockery.disable();
        cb();
    },

    'calling version() designates the current working directory as the repo': function (test) {
        test.expect(1);
        let version = require(testPath);
        version();
        test.equal(gitMock.args[0][0], process.cwd(), 'git was initialized with current directory as its repo');
        test.done();
    },

    'calling version() with a clean working directory in master bumps version in package.json file, stages it, creates new version tag, and pushes new tag to remote repo': function (test) {
        test.expect(4);
        let version = require(testPath);
        let versionType = 'minor';
        let newVersionNumber = '0.2.5';
        let currentBranch = 'master';
        let afterBumpStatus = {
            staged: [],
            unstaged: [ { file: 'package.json', status: 'modified' } ],
            untracked: []
        };
        localRepoMock.status.onFirstCall().yields(null, afterBumpStatus); // return status after package.json file has been bumped
        localRepoMock.add.yields(null); // staged files success
        localRepoMock.commit.yields(null); // commit success
        let getBranchesResp = {current: currentBranch};
        localRepoMock.getBranches.yields(null, getBranchesResp); // return current branch
        localRepoMock.checkout.yields(null); // checkout success
        localRepoMock.merge.yields(null); // merge success
        localRepoMock.push.yields(null); // push branch success
        localRepoMock.createTag.yields(null); // create tag success
        bumpStubPromise.resolve(newVersionNumber);
        version(versionType).then(function () {
            test.equal(bumpStub.args[0][0], versionType, 'bump was called with correct version type passed');
            test.deepEqual(localRepoMock.add.getCall(0).args[0], ['package.json'], 'bumped file was staged correctly');
            test.ok(localRepoMock.push.getCall(0).calledWith('origin', 'v' + newVersionNumber), 'tag was pushed to correct origin branch');
            test.ok(localRepoMock.push.getCall(1).calledWith('origin', currentBranch), 'branch was pushed to remote');
            test.done();
        });
    },

    'calling version() with a clean working directory calls correct git methods with "v" prefix': function (test) {
        test.expect(3);
        let version = require(testPath);
        let versionType = 'minor';
        let newVersionNumber = '0.2.5';
        let currentBranch = 'master';
        let afterBumpStatus = {
            staged: [],
            unstaged: [ { file: 'package.json', status: 'modified' } ],
            untracked: []
        };
        localRepoMock.status.onFirstCall().yields(null, afterBumpStatus); // return status after package.json file has been bumped
        localRepoMock.add.yields(null); // staged files success
        localRepoMock.commit.yields(null); // commit success
        let getBranchesResp = {current: currentBranch};
        localRepoMock.getBranches.yields(null, getBranchesResp); // return current branch
        localRepoMock.checkout.yields(null); // checkout success
        localRepoMock.merge.yields(null); // merge success
        localRepoMock.push.yields(null); // push branch success
        localRepoMock.createTag.yields(null); // create tag success
        bumpStubPromise.resolve(newVersionNumber);
        version(versionType).then(function () {
            test.equal(localRepoMock.commit.args[0][0], newVersionNumber, 'staged files were committed successfully');
            test.equal(localRepoMock.createTag.args[0][0], 'v' + newVersionNumber, 'correct tag version was created');
            test.equal(localRepoMock.push.args[0][1], 'v' + newVersionNumber, 'correct tag was pushed');
            test.done();
        });
    },

    'calling version() with a clean working directory a non-master branch bumps version in package.json file, stages it, commits it, merges contents into master, creates new version tag, and pushes new tag to remote repo': function (test) {
        test.expect(8);
        let version = require(testPath);
        let versionType = 'minor';
        let newVersionNumber = '0.2.5';
        let currentBranch = 'my-branch';
        let productionBranch = 'master';
        let afterBumpStatus = {
            staged: [],
            unstaged: [ { file: 'package.json', status: 'modified' } ],
            untracked: []
        };
        localRepoMock.status.onFirstCall().yields(null, afterBumpStatus); // return status after package.json file has been bumped
        localRepoMock.add.yields(null); // staged files success
        localRepoMock.commit.yields(null); // commit success
        let getBranchesResp = {current: currentBranch};
        localRepoMock.getBranches.yields(null, getBranchesResp); // return current branch
        localRepoMock.checkout.yields(null); // checkout success
        localRepoMock.merge.yields(null); // merge success
        localRepoMock.push.yields(null); // push branch success
        localRepoMock.createTag.yields(null); // create tag success
        bumpStubPromise.resolve(newVersionNumber);
        let releaseMessage = 'my release worked';
        promptMock.returns(Promise.resolve(releaseMessage));
        version(versionType).then(function () {
            test.equal(bumpStub.args[0][0], versionType, 'bump was called with correct version type passed');
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

    'does not call "prompt" when a commitMessage is supplied': function (test) {
        test.expect(1);
        let version = require(testPath);
        bumpStubPromise.resolve('0.0.0');
        version('patch', {commitMessage: 'booyah'}).then(function () {
            test.equal(promptMock.callCount, 0);
            test.done();
        });
    },

    'prompts user for version commit message': function (test) {
        test.expect(1);
        let version = require(testPath);
        let versionNum = '0.0.0';
        bumpStubPromise.resolve(versionNum);
        version('patch').then(function () {
            test.equal(promptMock.callCount, 1);
            test.done();
        });
    },

    'does not prompt user for version commit message if when commit message is already supplied': function (test) {
        test.expect(1);
        let version = require(testPath);
        let versionNum = '0.0.0';
        bumpStubPromise.resolve(versionNum);
        version('patch', {commitMessage: 'my commit message'}).then(function () {
            test.equal(promptMock.callCount, 0);
            test.done();
        });
    },

    'does not attempt to checkout to master or merge into master if already on master branch': function (test) {
        test.expect(2);
        let version = require(testPath);
        let versionType = 'minor';
        let newVersionNumber = '0.2.5';
        let currentBranch = 'master';
        let afterBumpStatus = {
            staged: [],
            unstaged: [ { file: 'package.json', status: 'modified' } ],
            untracked: []
        };
        localRepoMock.status.onFirstCall().yields(null, afterBumpStatus); // return status after package.json file has been bumped
        localRepoMock.add.yields(null); // staged files success
        localRepoMock.commit.yields(null); // commit success
        let getBranchesResp = {current: currentBranch};
        localRepoMock.getBranches.yields(null, getBranchesResp); // return current branch
        localRepoMock.checkout.yields(null); // checkout success
        localRepoMock.merge.yields(null); // merge success
        localRepoMock.push.yields(null); // push branch success
        localRepoMock.createTag.yields(null); // create tag success
        bumpStubPromise.resolve(newVersionNumber);
        version(versionType).then(function () {
            test.ok(localRepoMock.checkout.neverCalledWith('master'));
            test.ok(localRepoMock.merge.neverCalledWith('master'));
            test.done();
        });
    },

};
