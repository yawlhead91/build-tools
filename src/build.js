'use strict';
var glob = require('glob');
var path = require('path');
var Promise = require('promise');

var internalModulePath = path.resolve(__dirname, '..');

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
            paths[process.cwd() + '/' + dist + '/' + path.basename(filePath)] = [filePath];
        });
        return paths;
    };

    var buildUglifyFiles = function () {
        var paths = {};
        srcFiles.forEach(function (filePath) {
            var baseFileName = path.basename(filePath).split('.js')[0];
            paths[process.cwd() + '/' + dist + '/' + baseFileName + '-min.js'] = [filePath];
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

    require(internalModulePath + '/node_modules/grunt-contrib-clean/tasks/clean')(grunt);
    require(internalModulePath + '/node_modules/grunt-contrib-uglify/tasks/uglify')(grunt);
    require(internalModulePath + '/node_modules/grunt-banner/tasks/usebanner')(grunt);
    require(internalModulePath + '/node_modules/grunt-browserify/tasks/browserify')(grunt);

    grunt.task.run(['clean:dist', 'browserify:dist', 'uglify', 'usebanner']);
    // run tests
    return require('./test')(grunt, args);
};