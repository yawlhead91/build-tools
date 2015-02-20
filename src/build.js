'use strict';

var rootPath = process.cwd();

module.exports = function(grunt, args) {
    var btConfig = grunt.config.get('bt') || {};
    var dist = btConfig.dist || 'dist';

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
                        dest: dist,
                        src: [
                            '**/*.js'
                        ]
                    }
                ]
            }
        },
        concat: {
            options: {
                stripBanners: true
            },
            dist: {
                dest: dist + '/<%= pkg.name %>.js',
                src: ['src/**/*.js']
            }
        },
        uglify: {
            dist: {
                src: dist + '/<%= pkg.name %>.js',
                dest: dist + '/<%= pkg.name %>.min.js'
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
                    src: [dist + '/**/*.js']
                }
            }
        }
    });

    require(rootPath + '/node_modules/grunt-contrib-clean/tasks/clean')(grunt);
    require(rootPath + '/node_modules/grunt-contrib-copy/tasks/copy')(grunt);
    require(rootPath + '/node_modules/grunt-contrib-uglify/tasks/uglify')(grunt);
    require(rootPath + '/node_modules/grunt-contrib-concat/tasks/concat')(grunt);
    require(rootPath + '/node_modules/grunt-banner/tasks/usebanner')(grunt);

    grunt.task.run(['clean:dist', 'concat', 'uglify', 'usebanner']);
    // run tests
    require('./test')(grunt, args);

};