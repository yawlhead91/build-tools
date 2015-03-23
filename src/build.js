'use strict';
var glob = require('glob');
var Promise = require('promise');
var fs = require('fs-extra');
var utils = require('./utils');
var test = require('./test');

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

    var createBanner = function () {
        // Set up defaults for the options hash
        var pkg = require(process.cwd() + '/package.json');
        var options = {
            position: 'top',
            banner: '/** \n' +
            '* ' + pkg.name + ' - v' + pkg.version + '.\n' +
            '* ' + pkg.repository.url + '\n' +
            '* Copyright ' + grunt.template.today("yyyy") + ' ' + pkg.author.name + '. Licensed MIT.\n' +
            '*/\n',
            linebreak: false,
            process: false
        };
        var files = [process.cwd() + '/' + dist + '/**/*.js'];

        var re = null;

        if ( options.pattern ) {
            re = new RegExp(options.pattern);
        }
        var linebreak = grunt.util.linefeed;

        files.forEach(function (globPath) {
            var filePaths = glob.sync(globPath);
            filePaths.forEach( function (src) {
                var fileContents = fs.readFileSync(src, 'utf8');
                if (re && !re.test(fileContents) ) {
                    return;
                }
                fs.writeFileSync(src, options.banner + linebreak + fileContents);
                console.log( 'Banner added to ' + src);
            });
        });
        console.log('banner creation finished successfully' );
        return Promise.resolve();
    };

    var browserifyFiles = function () {
        console.log(btConfig.build.files);
        if (btConfig.build && btConfig.build.files) {
            return utils.browserifyFiles({
                files: btConfig.build.files
            });
        } else {
            return Promise.resolve();
        }
    };

    var uglifyFiles = function () {
        if (btConfig.min && btConfig.min.files) {
            return utils.uglifyFiles({files: btConfig.min.files});
        } else {
            return Promise.resolve();
        }
    };

    // run tests first
    return test(grunt, args).then(function () {
        return utils.clean(dist).then(function () {
            return browserifyFiles().then(function () {
                return uglifyFiles().then(function () {
                    return createBanner().then(function () {
                        console.log('done build!');
                    });
                });
            });
        });
    });
};