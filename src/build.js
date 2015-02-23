'use strict';
var glob = require('glob');
var path = require('path');

var extRootPath = process.cwd();

module.exports = function(grunt, args) {
    var btConfig = grunt.config.get('bt') || {},
        dist = btConfig.dist || 'dist',
        srcFileGlobPatterns = btConfig.src || [],
        srcFiles = [];
    
    srcFileGlobPatterns.forEach(function (pattern) {
        glob.sync(pattern).forEach(function (path) {
            srcFiles.push(path);
        });
    });

    var buildBrowserifyFiles = function () {
        var paths = {};
        srcFiles.forEach(function (filePath) {
            paths[extRootPath + '/' + dist + '/' + path.basename(filePath)] = [filePath];
        });
        return paths;
    };

    var buildUglifyFiles = function () {
        var paths = {};
        srcFiles.forEach(function (filePath) {
            var baseFileName = path.basename(filePath).split('.js')[0];
            paths[extRootPath + '/' + dist + '/' + baseFileName + '-min.js'] = [filePath];
        });
        return paths;
    };

    grunt.config.merge({
        clean: {
            dist: dist
        },
        uglify: {
            dist: btConfig.uglify
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
            dist: btConfig.browserify
        }
    });

    grunt.task.loadNpmTasks('grunt-contrib-clean');
    grunt.task.loadNpmTasks('grunt-contrib-uglify');
    grunt.task.loadNpmTasks('grunt-banner');
    grunt.task.loadNpmTasks('grunt-browserify');

    grunt.task.run(['clean:dist', 'browserify:dist', 'uglify', 'usebanner']);
    // run tests
    require('./test')(grunt, args);

};