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
        copy: {
            'test-libs': {
                files: [
                    {
                        expand: true,
                        cwd: 'bower_components/requirejs',
                        dest: 'tests/libs/requirejs',
                        src: ['require.js']
                    },
                    {
                        expand: true,
                        cwd: 'bower_components/qunit/qunit',
                        dest: 'tests/libs/qunit',
                        src: ['**/*']
                    },
                    {
                        expand: true,
                        cwd: 'bower_components/sinonjs',
                        dest: 'tests/libs/sinon',
                        src: ['sinon.js']
                    }
                ]
            }
        },

        // Unit tests.
        nodeunit: {
            tests: ['test/*_test.js']
        }

    });

    // Load THIS plugin's task(s).
    grunt.loadTasks('tasks');

    // These plugins provide necessary tasks.
    // Load grunt tasks from node modules
    require("load-grunt-tasks")(grunt);

};
