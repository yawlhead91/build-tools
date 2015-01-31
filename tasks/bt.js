/*
 * grunt-build-tools
 * https://github.com/mkay581/build-tools
 *
 * Copyright (c) 2015 Mark Kennedy
 * Licensed under the MIT license.
 */

'use strict';


module.exports = function(grunt) {

    grunt.config.set('bump', {
        options: {
            files: ['package.json', 'bower.json'],
            commit: false,
            createTag: false,
            tagName: 'v%VERSION%',
            tagMessage: 'v%VERSION%',
            push: false,
            pushTo: 'origin',
            updateConfigs: ['pkg']
        }
    });

    require('grunt-bump')(grunt);

    grunt.registerTask('bt', 'Set of custom build tools.', function() {

        if (arguments[0] === 'release') {
            release(arguments[1]);
        }
    });

    function release (type) {
        grunt.task.run([
            'bump:' + (type || 'patch'),
            'build'
        ]);
    }


};
