'use strict';

module.exports = function(grunt, args) {

    grunt.config.set('connect', {
        test: {
            options: {
                hostname: 'localhost',
                port: 7000
            }
        },
        local: {
            options: {
                keepalive: true
            }
        }
    });
    require('./../node_modules/grunt-contrib-connect/tasks/connect')(grunt);

    grunt.task.run(['connect:local']);

};