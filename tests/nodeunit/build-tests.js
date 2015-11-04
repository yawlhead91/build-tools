'use strict';
var testPath = './../../src/build';
var sinon = require('sinon');

module.exports = {

    setUp: function (cb) {
        sinon.stub(console, 'warn');
        cb();
    },

    tearDown: function (cb) {
        console.warn.restore();
        cb();
    },

    'calling test with a configuration with empty tests resolves immediately': function (test) {
        test.expect(1);
        var build = require(testPath);
        build().then(function () {
            test.ok('true');
            test.done();
        }, test.done);
    },

    'calling test with empty object resolves immediately': function (test) {
        test.expect(1);
        var build = require(testPath);
        build({}).then(function () {
            test.ok('true');
            test.done();
        }, test.done);
    }

};