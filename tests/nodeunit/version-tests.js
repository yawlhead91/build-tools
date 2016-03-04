'use strict';
var testPath = './../../src/version';
var mockery = require('mockery');
var sinon = require('sinon');
var Promise = require('promise');

var gitMock;
var localRepoMock;
var bumpStub;

var allowables = ['util', testPath, 'promise', './bump'];

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
        bumpStub = sinon.stub().returns(Promise.resolve());
        mockery.registerMock('./bump', bumpStub);
        mockery.registerAllowables(allowables);
        sinon.stub(console, 'log');
        sinon.stub(console, 'error');
        cb();
    },

    tearDown: function (cb) {
        console.log.restore();
        console.error.restore();
        mockery.deregisterMock('gitty');
        mockery.deregisterMock('./bump');
        mockery.deregisterAllowables(allowables);
        mockery.disable();
        cb();
    },

    'calling version() designates the current working directory as the repo': function (test) {
        test.expect(1);
        var version = require(testPath);
        version();
        test.equal(gitMock.args[0][0], process.cwd(), 'git was initialized with current directory as its repo');
        test.done();
    },

    'calling version() with a clean working directory calls correct git methods': function (test) {
        test.expect(10);
        var version = require(testPath);
        var versionType = 'minor';
        var newVersionNumber = '0.2.5';
        var currentBranch = 'master';
        var statusResp = {
            staged: [],
            unstaged: [],
            untracked: []
        };
        var afterBumpStatus = {
            staged: [],
            unstaged: [ { file: 'package.json', status: 'modified' } ],
            untracked: []
        };
        localRepoMock.status.onFirstCall().yields(null, afterBumpStatus); // return status after package.json file has been bumped
        localRepoMock.add.yields(null); // staged files success
        localRepoMock.commit.yields(null); // commit success
        var getBranchesResp = {current: currentBranch};
        localRepoMock.getBranches.yields(null, getBranchesResp); // return current branch
        localRepoMock.checkout.yields(null); // checkout success
        localRepoMock.merge.yields(null); // merge success
        localRepoMock.push.yields(null); // push branch success
        localRepoMock.createTag.yields(null); // create tag success
        bumpStub.returns(Promise.resolve(newVersionNumber));
        version(versionType).then(function () {
            test.equal(bumpStub.args[0][0], versionType, 'bump was called with correct version type passed');
            test.deepEqual(localRepoMock.add.args[0][0], ['package.json'], 'bumped file was staged correctly');
            test.equal(localRepoMock.commit.args[0][0], newVersionNumber, 'staged files were committed successfully');
            test.equal(localRepoMock.checkout.args[0][0], currentBranch, 'correct branch was checked out');
            test.equal(localRepoMock.push.args[0][0], 'origin', 'correct remote was pushed');
            test.equal(localRepoMock.push.args[0][1], currentBranch, 'correct branch was pushed');
            test.equal(localRepoMock.createTag.args[0][0], newVersionNumber, 'correct tag version was created');
            test.equal(localRepoMock.push.args[1][0], 'origin', 'correct remote tag origin was pushed');
            test.equal(localRepoMock.push.args[1][1], newVersionNumber, 'correct tag was pushed');
            test.equal(localRepoMock.checkout.args[1][0], currentBranch, 'correct branch was checked backed out');
            test.done();
        });
    }

};