'use strict';

module.exports = function(grunt, args) {

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

    grunt.task.run([
        'bump:' + (args[0] || 'patch'),
        'bt:build'
    ]);

};
