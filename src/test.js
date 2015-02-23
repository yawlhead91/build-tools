'use strict';

var glob = require('glob');
var fs = require('fs');

var extRootPath = process.cwd();
var intRootPath = extRootPath + '/node_modules/grunt-build-tools';

module.exports = function(grunt, args) {
    var config = grunt.config.get('bt') || {},
        testsConfig = config.tests || {},
        testFileGlobPatterns = testsConfig.qunit || [],
        testFilePaths = [];

    // compile test file array
    testFileGlobPatterns.forEach(function (pattern) {
        glob.sync(pattern).forEach(function (filePath) {
            testFilePaths.push(filePath);
        });
    });

    // deletes a folder and its contents
    // @todo: make this function asynchonous, it's blocking the Ctrl+C SIGINT triggering!
    var deleteFolderRecursive = function(path) {
        if( fs.existsSync(path) ) {
            fs.readdirSync(path).forEach(function(file,index){
                var curPath = path + "/" + file;
                if(fs.lstatSync(curPath).isDirectory()) { // recurse
                    deleteFolderRecursive(curPath);
                } else { // delete file
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(path);
        }
    };

    function getBrowserifyTestFilePaths() {
        var paths = {};
        testFilePaths.forEach(function (filePath) {
            paths['tmp/tests/qunit/files/' + filePath] = [filePath];
        });
        return paths;
    }

    function getTestHtml() {
        var html = '';
        testFilePaths.forEach(function (filePath) {
            html += '<script src="files/' + filePath + '"></script>';
        });
        return html;
    }

    grunt.config.merge({
        qunit: {
            local: {
                options: {
                    urls: [
                        'http://localhost:7755/qunit/index.html'
                    ]
                }
            }
        },
        connect: {
            'test-server': {
                options: {
                    port: 7755,
                    hostname: '*',
                    base: ['.', 'tmp', 'tmp/tests'],
                    onCreateServer: function(server) {
                        server.on('close', function() {
                            // remove tmp directory
                            deleteFolderRecursive('tmp');
                        });
                        // when server is killed on UNIX-like systems, call close, so we can remove tmp directory
                        process.on('SIGINT', function() {
                            server.close();
                        });
                    }
                }
            }
        },
        clean: {
            tmp: ['tmp']
        },
        copy: {
            'utility_test_files': {
                expand: true,
                cwd: intRootPath + '/src/test',
                dest: 'tmp/tests',
                src: ['**/*']
            }
        },
        browserify: {
            tests: {
                src: testFilePaths,
                dest: 'tmp/tests/qunit/tests.js',
                options: {
                    alias: [
                        './tmp/tests/qunit/qunit.js:qunit',
                        './tmp/tests/test-utils.js:test-utils'
                    ]
                }
            }
        }
    });

    // must load all tasks manually for user
    grunt.task.loadNpmTasks('grunt-contrib-clean');
    grunt.task.loadNpmTasks('grunt-contrib-qunit');
    grunt.task.loadNpmTasks('grunt-contrib-connect');
    grunt.task.loadNpmTasks('grunt-contrib-clean');
    grunt.task.loadNpmTasks('grunt-contrib-copy');
    grunt.task.loadNpmTasks('grunt-browserify');


    var tasks = [
        'clean:tmp',
        'copy:utility_test_files',
        'browserify:tests'
    ];
    
    if (args[0] === 'server') {
        // run test server!
        tasks.push('connect:test-server:keepalive');
    } else {
        tasks = tasks.concat([
            'connect:test-server',
            'qunit:local',
            'clean:tmp'
        ]);
    }
    grunt.task.run(tasks);


};