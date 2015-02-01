'use strict';

module.exports = function(grunt, args) {
    var btConfig = grunt.config.get('bt') || {};
    var dist = btConfig.dist || ['dist'];
    var uglifyFiles = btConfig.uglifyFiles;

    grunt.config.merge({
        clean: {
            dist: dist
        },
        copy: {
            build: {
                files: [
                    {
                        expand: true,
                        cwd: 'src',
                        dest: dist[0],
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
        },
        usebanner: {
            all: {
                options: {
                    banner: '/** \n' +
                    '* <%= pkg.name %> - v<%= pkg.version %>.\n' +
                    '* <%= pkg.repository.url %>\n' +
                    '* Copyright <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>. Licensed MIT.\n' +
                    '*/\n',
                    linebreak: false
                },
                files: {
                    src: [dist[0] + '/**/*.js']
                }
            }
        }
    });

    require('node_modules/grunt-contrib-clean/tasks/clean')(grunt);
    require('node_modules/grunt-contrib-copy/tasks/copy')(grunt);
    require('node_modules/grunt-contrib-uglify/tasks/uglify')(grunt);
    require('node_modules/grunt-banner/tasks/usebanner')(grunt);

    var tasks = ['clean:dist', 'copy'];

    if (uglifyFiles) {
        tasks.push('uglify');
    }
    tasks.push('usebanner');

    grunt.task.run(tasks);
    // run tests
    require('./test')(grunt, args);

};