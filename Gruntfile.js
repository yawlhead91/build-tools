'use strict';

module.exports = function (grunt) {

    grunt.initConfig({
        bt: {
            tests: {
                mocha: {
                    src: ['tests/mocha/test-utils-tests.js']
                }
            }
        }
    });

    // Load THIS plugin's task(s) internally.
    grunt.loadTasks('tasks');

};