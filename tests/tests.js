"use strict";

// set config options
require.config({
    baseUrl: '../',
    paths: {
        qunit: 'tests/qunit-require',
        sinon: 'tests/libs/sinon/sinon',
        'test-utils': 'tests/test-utils'
    },
    shim: {
        sinon: {
            exports: 'sinon'
        }
    }
});

var testsFiles = [TEST_FILES];

// require each test
require(testsFiles, function() {
    QUnit.config.requireExpects = true;
    QUnit.start();
});