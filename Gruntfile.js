'use strict';

module.exports = function (grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json")
    });

    require("load-grunt-tasks")(grunt);

    // Load THIS plugin's task(s).
    grunt.loadTasks('tasks');


};
