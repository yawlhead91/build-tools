'use strict';
var glob = require('glob');
var path = require('path');

var rootPath = process.cwd();

module.exports = function(grunt, args) {
    var btConfig = grunt.config.get('bt') || {},
        dist = btConfig.dist || 'dist',
        srcFileGlobPatterns = btConfig.src,
        srcFiles = [];

    srcFileGlobPatterns.forEach(function (pattern) {
        glob.sync(pattern).forEach(function (path) {
            srcFiles.push(path);
        });
    });

    var buildBrowserifyFiles = function () {
        var paths = {};
        srcFiles.forEach(function (filePath) {
            paths[dist + '/' + path.basename(filePath)] = [filePath];
        });
        return paths;
    };

    var buildUglifyFiles = function () {
        var paths = {};
        srcFiles.forEach(function (filePath) {
            var baseFileName = path.basename(filePath).split('.js')[0];
            paths[dist + '/' + baseFileName + '-min.js'] = [filePath];
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