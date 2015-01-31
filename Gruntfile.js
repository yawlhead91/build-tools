/*
 * grunt-build-tools
 * https://github.com/mkay581/build-tools
 *
 * Copyright (c) 2015 Mark Kennedy
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        jshint: {
            all: [
                'Gruntfile.js',
                'tasks/*.js',
                '<%= nodeunit.tests %>'
            ],
            options: {
                jshintrc: '.jshintrc'
            }
        },

        // Before generating any new files, remove any previously-created files.
        clean: {
            tests: ['tmp']
        },

        // Configuration to be run (and then tested).
        //build_tools: {
        //    default_options: {
        //        options: {},
        //        files: {
        //            'tmp/default_options': ['test/fixtures/testing', 'test/fixtures/123']
        //        }
        //    },
        //    custom_options: {
        //        options: {
        //            separator: ': ',
        //            punctuation: ' !!!'
        //        },
        //        files: {
        //            'tmp/custom_options': ['test/fixtures/testing', 'test/fixtures/123']
        //        }
        //    }
        //},

        // Unit tests.
        nodeunit: {
            tests: ['test/*_test.js']
        },

    });

    // Load THIS plugin's task(s).
    //grunt.loadTasks('grunt-tasks');

    // These plugins provide necessary tasks.
    // Load grunt tasks from node modules
    require("load-grunt-tasks")(grunt);


    grunt.registerTask( "build-files", [
        "clean",
        "copy",
        "uglify",
        "usebanner:all"
    ]);

    grunt.registerTask( "build", [
        "build-files",
        "connect:test",
        "qunit:local"
    ]);


    // Whenever the "test" task is run, first clean the "tmp" dir, then run this
    // plugin's task(s), then test the result.
    grunt.registerTask('test', ['clean', 'build_tools', 'nodeunit']);

    // By default, lint and run all tests.
    grunt.registerTask('default', ['jshint', 'test']);

};
