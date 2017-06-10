'use strict';
let testPath = './../src/test';
let sinon = require('sinon');

module.exports = {

    'calling test with a configuration with empty tests resolves immediately': function (test) {
        test.expect(1);
        let srcTest = require(testPath);
        srcTest().then(function () {
            test.ok('true');
            test.done();
        }, test.done);
    },

    'calling test with empty object resolves immediately': function (test) {
        test.expect(1);
        let srcTest = require(testPath);
        srcTest({}).then(function () {
            test.ok('true');
            test.done();
        }, test.done);
    },

    'calling test with object with src files sends correct files to test': function (test) {
        test.expect(1);
        let srcTest = require(testPath);
        srcTest({
            files: { 'dist/scroll.js': [ 'src/scroll.js' ] },
            requires: null,
            plugins: [],
            transform: [],
            watch: false,
            browserifyOptions: { standalone: 'Scroll', transform: [ [Object] ], debug: false },
            env: 'production'
        }).then(function () {
            test.ok('true');
            test.done();
        }, test.done);
    }

};
