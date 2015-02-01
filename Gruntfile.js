'use strict';

module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        // Before generating any new files, remove any previously-created files.
        clean: {
            tests: ['tmp']
        }
    });

    // These plugins provide necessary tasks.
    // Load grunt tasks from node modules
    require("load-grunt-tasks")(grunt);

    // Load THIS plugin's task(s).
    grunt.loadTasks('tasks');


};
