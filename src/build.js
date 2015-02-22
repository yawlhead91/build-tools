'use strict';
var glob = require('glob');

var rootPath = process.cwd();

module.exports = function(grunt, args) {
    var btConfig = grunt.config.get('bt') || {};
    var dist = btConfig.dist || 'dist';
    var srcFiles = glob.sync('**/*.js', {cwd: 'src'});

    var buildBrowserifyFiles = function () {
        var paths = {};
        srcFiles.forEach(function (filePath) {
            paths[dist + '/' + filePath] = ['src/' + filePath];
        });
        return paths;
    };

    var buildUglifyFiles = function () {
        var paths = {};
        srcFiles.forEach(function (filePath) {
            var frags = filePath.split('.js');
            paths[dist + '/' + frags[0] + '-min.js'] = ['src/' + filePath];
        });
        return paths;
    };

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
        uglify: {
            dist: {
                files: buildUglifyFiles()
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
        },
        browserify: {
            dist: {
                files: buildBrowserifyFiles()
            }
        }
    });

    require(rootPath + '/node_modules/grunt-contrib-clean/tasks/clean')(grunt);
    require(rootPath + '/node_modules/grunt-contrib-copy/tasks/copy')(grunt);
    require(rootPath + '/node_modules/grunt-contrib-uglify/tasks/uglify')(grunt);
    require(rootPath + '/node_modules/grunt-contrib-concat/tasks/concat')(grunt);
    require(rootPath + '/node_modules/grunt-banner/tasks/usebanner')(grunt);
    require(rootPath + '/node_modules/grunt-browserify/tasks/browserify')(grunt);

    grunt.task.run(['clean:dist', 'browserify:dist', 'uglify', 'usebanner']);
    // run tests
    require('./test')(grunt, args);

};