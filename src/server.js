'use strict';

module.exports = function(grunt, args) {

    grunt.config.merge({
        connect: {
            local: {
                options: {
                    keepalive: true
                }
            }
        }
    });
    require(process.cwd() + '/node_modules/grunt-contrib-connect/tasks/connect')(grunt);

    grunt.task.run(['connect:local']);

};