'use strict';

module.exports = function(grunt, args) {
    var btConfig = grunt.config.get('bt') || {};
    var uglifyFiles = btConfig.uglifyFiles;

    grunt.config.merge({
        clean: {
            dist: btConfig.dist || ['dist']
        },
        copy: {
            build: {
                files: [
                    {
                        expand: true,
                        cwd: 'src',
                        dest: 'dist',
                        src: [
                            '**/*.js'
                        ]
                    }
                ]
            }
        },
        uglify: {
            my_target: {
                files: uglifyFiles
            }
        }
    });
    
    require('./../node_modules/grunt-contrib-clean/tasks/clean')(grunt);
    require('./../node_modules/grunt-contrib-copy/tasks/copy')(grunt);
    require('./../node_modules/grunt-contrib-uglify/tasks/uglify')(grunt);
    
    var tasks = ['clean:dist', 'copy'];
    
    if (uglifyFiles) {
        tasks.push('uglify');
    }

    grunt.task.run(tasks);
    // run tests
    require('./test')(grunt, args);

};