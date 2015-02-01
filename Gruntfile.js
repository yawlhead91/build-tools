'use strict';

module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
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
        }
    });

    // These plugins provide necessary tasks.
    // Load grunt tasks from node modules
    require("load-grunt-tasks")(grunt);

    // Load THIS plugin's task(s).
    grunt.loadTasks('tasks');


};
