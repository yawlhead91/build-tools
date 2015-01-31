'use strict';

module.exports = function(grunt, args) {

    grunt.config.set('qunit', {
        local: {
            options: {
                urls: [
                    'http://localhost:7000/tests/index.html'
                ]
            }
        }
    });
    grunt.config.merge({
        connect: {
            test: {
                options: {
                    hostname: 'localhost',
                    port: 7000
                }
            }
        }
    });
    require('./../node_modules/grunt-contrib-qunit/tasks/qunit')(grunt);
    require('./../node_modules/grunt-contrib-connect/tasks/connect')(grunt);

    grunt.task.run([
        'connect:test',
        'qunit:local'
    ]);

};