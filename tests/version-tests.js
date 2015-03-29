'use strict';
var testPath = './../src/version';
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
        localRepoMock = {
            status: sinon.stub()
        };
        gitMock = sinon.stub().returns(localRepoMock);
        mockery.registerMock('gitty', gitMock);
        bumpStub = sinon.stub().returns(Promise.resolve());
        mockery.registerMock('./bump', bumpStub);
        mockery.registerAllowables(allowables);
        cb();
    },

    tearDown: function (cb) {
        mockery.deregisterMock('gitty');
        mockery.deregisterMock('./bump');
        mockery.deregisterAllowables(allowables);
        mockery.disable();
        cb();
    },

    'calling version() designates the current working directory as the repo': function (test) {
        test.expect(1);
        var version = require(testPath);
        version().then(function () {
            test.equal(gitMock.args[0][0], process.cwd(), 'git was initialized with current directory as its repo');
            test.done();
        });
    },

    'calling version() with a dirty current working directory halts versioning': function (test) {
        test.expect(1);
        var version = require(testPath);
        var statusResp = {
            staged: [],
            unstaged: [ { file: 'package.json', status: 'modified' } ],
            untracked: [ 'src/version.js', 'tests/version-tests.js' ]
        };
        localRepoMock.status.yields(null, statusResp); // return unclean status
        version().then(function () {
            test.equal(bumpStub.callCount, 0, 'files were not bumped');
            test.done();
        });
    },

    'calling version() with a clean working directory doesnt halt versioning': function (test) {
        test.expect(1);
        var version = require(testPath);
        var versionType = 'minor';
        var statusResp = {
            staged: [],
            unstaged: [],
            untracked: []
        };
        localRepoMock.status.yields(null, statusResp); // return unclean status
        version().then(function () {
            test.equal(bumpStub.args[0][0], versionType, 'bump was called with correct version type passed');
            test.done();
        });
    }

};