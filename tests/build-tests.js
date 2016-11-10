'use strict';
var testPath = './../src/build';
var sinon = require('sinon');
var mockery = require('mockery');
var Promise = require('promise');

var cleanMock,
    copyMock,
    browserifyMock,
    minifyMock,
    bannerMock,
    serverMock,
    sassMock;
var serverConstructorMock;

var allowables = ['util', testPath, 'promise', './bump'];

module.exports = {

    setUp: function (cb) {
        sinon.stub(console, 'warn');
        sinon.stub(console, 'log');
        sinon.stub(console, 'error');
        mockery.enable({useCleanCache: true});
        mockery.warnOnUnregistered(false); // suppress non-allowed modules
        cleanMock = sinon.stub().returns(Promise.resolve());
        copyMock = sinon.stub().returns(Promise.resolve());
        sassMock = sinon.stub().returns(Promise.resolve());
        browserifyMock = sinon.stub().returns(Promise.resolve());
        minifyMock = sinon.stub().returns(Promise.resolve());
        bannerMock = sinon.stub().returns(Promise.resolve());
        serverMock = {
            start: sinon.stub().returns(Promise.resolve())
        };
        serverConstructorMock = sinon.stub().returns(serverMock);
        mockery.registerMock('./clean', cleanMock);
        mockery.registerMock('./copy', copyMock);
        mockery.registerMock('./sassify', sassMock);
        mockery.registerMock('./browserify', browserifyMock);
        mockery.registerMock('./minify', minifyMock);
        mockery.registerMock('./banner', bannerMock);
        mockery.registerMock('./server', serverConstructorMock);
        mockery.registerAllowables(allowables);
        cb();
    },

    tearDown: function (cb) {
        mockery.deregisterAll();
        mockery.disable();
        console.warn.restore();
        console.log.restore();
        console.error.restore();
        cb();
    },

    'calling with no parameters returns a resolved promise and does not call any modules': function (test) {
        test.expect(7);
        var build = require(testPath);
        build().then(function () {
            test.equal(cleanMock.callCount, 0);
            test.equal(copyMock.callCount, 0);
            test.equal(browserifyMock.callCount, 0);
            test.equal(minifyMock.callCount, 0);
            test.equal(bannerMock.callCount, 0);
            test.equal(serverConstructorMock.callCount, 0);
            test.equal(sassMock.callCount, 0);
            test.done();
        }, test.done);
    },

    'calling with empty object returns a resolved promise and does not call any modules': function (test) {
        test.expect(7);
        var build = require(testPath);
        build({}).then(function () {
            test.equal(cleanMock.callCount, 0);
            test.equal(copyMock.callCount, 0);
            test.equal(browserifyMock.callCount, 0);
            test.equal(minifyMock.callCount, 0);
            test.equal(bannerMock.callCount, 0);
            test.equal(serverConstructorMock.callCount, 0);
            test.equal(sassMock.callCount, 0);
            test.done();
        }, test.done);
    },

    'no dist option does not call any modules and still resolves': function (test) {
        test.expect(7);
        var build = require(testPath);
        build({}).then(function () {
            test.equal(cleanMock.callCount, 0);
            test.equal(copyMock.callCount, 0);
            test.equal(browserifyMock.callCount, 0);
            test.equal(minifyMock.callCount, 0);
            test.equal(bannerMock.callCount, 0);
            test.equal(serverConstructorMock.callCount, 0);
            test.equal(sassMock.callCount, 0);
            test.done();
        }, test.done);
    },

    'no files option does not call any modules and still resolves': function (test) {
        test.expect(7);
        var build = require(testPath);
        build({}).then(function () {
            test.equal(cleanMock.callCount, 0);
            test.equal(copyMock.callCount, 0);
            test.equal(browserifyMock.callCount, 0);
            test.equal(minifyMock.callCount, 0);
            test.equal(bannerMock.callCount, 0);
            test.equal(serverConstructorMock.callCount, 0);
            test.equal(sassMock.callCount, 0);
            test.done();
        }, test.done);
    },

    'dist option without a files option does NOT fire the clean module': function (test) {
        test.expect(1);
        var build = require(testPath);
        var options = {"blah": 2};
        build({dist: options}).then(function () {
            test.equal(cleanMock.callCount, 0);
            test.done();
        }, test.done);
    },

    'dist option with a files option fires the clean module with dist option': function (test) {
        test.expect(1);
        var build = require(testPath);
        var options = {"blah": 2};
        build({dist: options, files: {}}).then(function () {
            test.deepEqual(cleanMock.args[0], [options]);
            test.done();
        }, test.done);
    },

    'only files with .js extensions get passed to browserify': function (test) {
        test.expect(2);
        var build = require(testPath);
        var filesOption = {};
        var htmlDest = "dest/index.html";
        var jsDest = "dest/app.js";
        filesOption[htmlDest] = ['my/index.html'];
        filesOption[jsDest] = ["my/blah.js"];
        build({files: filesOption, dist: {}}).then(function () {
            test.equal(browserifyMock.args[0][0].files[jsDest], filesOption[jsDest], 'js file destination was passed');
            test.ok(!browserifyMock.args[0][0].files[htmlDest], 'html file destination was not passed');
            test.done();
        }, test.done);
    },

    'non-js files get passed to copy': function (test) {
        test.expect(2);
        var build = require(testPath);
        var filesOption = {};
        var htmlDest = "dest/index.html";
        var jsDest = "dest/app.js";
        filesOption[htmlDest] = ['my/index.html'];
        filesOption[jsDest] = ["my/blah.js"];
        build({files: filesOption, dist: {}}).then(function () {
            test.equal(copyMock.args[0][0].files[htmlDest], filesOption[htmlDest], 'html file destination was passed');
            test.ok(!copyMock.args[0][0].files[jsDest], 'js file destination was not passed');
            test.done();
        }, test.done);
    },

    'minifyFiles option gets passed to minify module': function (test) {
        test.expect(1);
        var build = require(testPath);
        var options = {"blah": 2};
        build({minifyFiles: options, dist: {}, files: {}}).then(function () {
            test.deepEqual(minifyMock.args[0][0].files, options);
            test.done();
        }, test.done);
    },

    'bannerFiles option gets passed as first argument to banner module': function (test) {
        test.expect(1);
        var build = require(testPath);
        var options = {"blah": 2};
        build({bannerFiles: options, dist: {}, files: {}}).then(function () {
            test.deepEqual(bannerMock.args[0], [options]);
            test.done();
        }, test.done);
    },

    'server module gets called when a local env option gets passed': function (test) {
        test.expect(1);
        var build = require(testPath);
        build({env: 'local', dist: {}, files: {}}).then(function () {
            test.equal(serverConstructorMock.callCount, 1);
            test.done();
        }, test.done);
    },

    'server module does NOT get called when no env option is passed': function (test) {
        test.expect(1);
        var build = require(testPath);
        build({dist: {}, files: {}}).then(function () {
            test.equal(serverConstructorMock.callCount, 0);
            test.done();
        }, test.done);
    },

    'should instantiate server and call its start method when "local" env option is passed': function (test) {
        test.expect(1);
        var build = require(testPath);
        build({env: 'local', dist: {}, files: {}}).then(function () {
            test.equal(serverMock.start.callCount, 1);
            test.done();
        }, test.done);
    },

    'server module does NOT get instantiated when a "production" env option gets passed': function (test) {
        test.expect(1);
        var build = require(testPath);
        build({env: 'production', dist: {}, files: {}}).then(function () {
            test.equal(serverConstructorMock.callCount, 0);
            test.done();
        }, test.done);
    },

    'should perform a "production" build even if "prod" is passed (deprecation check)': function (test) {
        var build = require(testPath);
        var filesOption = {};
        var htmlDest = "dest/index.html";
        var jsDest = "dest/app.js";
        filesOption[htmlDest] = ['my/index.html'];
        filesOption[jsDest] = ["my/blah.js"];
        build({env: 'prod', files: filesOption, dist: {}}).then(function () {
            test.equal(browserifyMock.args[0][0].files[jsDest], filesOption[jsDest], 'js file destination was passed');
            test.ok(!browserifyMock.args[0][0].files[htmlDest], 'html file destination was not passed');
            test.done();
        }, test.done);
    }

};