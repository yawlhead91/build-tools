'use strict';
var sinon = require('sinon');
var mockery = require('mockery');
var Promise = require("promise");
var releasePath = './../cli/release';
var testMock,
    buildMock,
    versionMock;
var promptMock;
var promptMockPromise;
var bumpMock;
var bumpMockPromise;
var githubApiMock;
var githubConstructor;
var btConfigMock;
var cologMock;
var spawnMock;
var spawnChildProcessMock;
var allowables = ['./../../cli/release', './../src/utils'];

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
        mockery.registerMock('./test', testMock);
        mockery.registerMock('./../src/prompt', promptMock);
        mockery.registerMock('./build', buildMock);
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
        cb();
    },

    tearDown: function (cb) {
        mockery.deregisterAll();
        mockery.disable();
        cb();
    },

    'should run tests': function (test) {
        test.expect(1);
        bumpMockPromise.resolve('0.0.5');
        promptMockPromise.resolve('');
        var release = require(releasePath);
        release(['patch']).then(function () {
            test.equal(testMock.callCount, 1);
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

    'should pass prod and test argument that is false to build function': function (test) {
        test.expect(1);
        bumpMockPromise.resolve('0.0.5');
        promptMockPromise.resolve('');
        var release = require(releasePath);
        release().then(function () {
            test.deepEqual(buildMock.args[0][0], ['prod', '--test=false']);
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
        btConfigMock = {github: {token: token}};
        mockery.registerMock(process.cwd() + '/bt-config', btConfigMock);
        var release = require(releasePath);
        release(['patch']).then(function () {
            test.equal(githubApiMock.authenticate.args[0][0].type, 'oauth');
            test.equal(githubApiMock.authenticate.args[0][0].token, token);
            test.done();
        });
    },

    'calls npm publish': function (test) {
        test.expect(2);
        bumpMockPromise.resolve('0.0.6');
        promptMockPromise.resolve('');
        let token = 'uebyx';
        btConfigMock = {github: {token: token}};
        mockery.registerMock(process.cwd() + '/bt-config', btConfigMock);
        var release = require(releasePath);
        release(['patch']).then(function () {
            test.equal(spawnMock.args[0][0], 'npm');
            test.deepEqual(spawnMock.args[0][1], ['publish']);
            test.done();
        });
    },


};
