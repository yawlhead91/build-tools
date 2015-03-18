'use strict';

var glob = require('glob');
var fs = require('fs');

var extRootPath = process.cwd();
var intRootPath = extRootPath + '/node_modules/grunt-build-tools';

module.exports = function(grunt, args) {
    var config = grunt.config.get('bt') || {},
        testsConfig = config.tests || {},
        testType = Object.keys(testsConfig)[0],// only run the first test suite declared.. for now
        keepalive = args[1] === 'server';

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

    /**
     * Merges the contents of two or more objects.
     * @param {object} obj - The target object
     * @param {...object} - Additional objects who's properties will be merged in
     */
    function extend(target) {
        var merged = target,
            source, i;
        for (i = 1; i < arguments.length; i++) {
            source = arguments[i];
            for (var prop in source) {
                if (source.hasOwnProperty(prop)) {
                    merged[prop] = source[prop];
                }
            }
        }
        return merged;
    }

    grunt.config.merge({
        connect: {
            'test-server': {
                options: {
                    port: 7755,
                    hostname: '*',
                    base: ['.', 'tmp', 'tmp/tests'],
                    onCreateServer: function(server) {
                        // when server is killed on UNIX-like systems, call close, so we can remove tmp directory
                        process.on('SIGINT', function() {
                            // remove tmp directory
                            deleteFolderRecursive('tmp');
                            server.close();
                            process.exit();
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
            'tests': {
                files: [
                    {
                        src: testsConfig[testType] ? testsConfig[testType].src : [],
                        dest: 'tmp/tests/' + testType + '/built-tests.js'
                    }
                ],

                options: extend({}, config.options, {
                    alias: [
                        './tmp/tests/qunit/qunit.js:qunit'
                    ],
                    browserifyOptions: {
                        debug: true
                    },
                    watch: true
                })
            }
        },
        qunit: {
            tests: {
                options: {
                    urls: [
                        'http://localhost:7755/qunit/index.html'
                    ]
                }
            }
        },
        mocha_phantomjs: {
            tests: {
                options: {
                    urls: ['http://localhost:7755/mocha/index.html']
                }
            }
        }
    });

    // must load all tasks manually for user
    var internalNpmPath = path.resolve(__dirname, '../node_modules');
    grunt.task.loadTasks(internalNpmPath + '/grunt-contrib-clean/tasks');
    grunt.task.loadTasks(internalNpmPath + '/grunt-contrib-qunit/tasks');
    grunt.task.loadTasks(internalNpmPath + '/grunt-contrib-connect/tasks');
    grunt.task.loadTasks(internalNpmPath + '/grunt-contrib-copy/tasks');
    grunt.task.loadTasks(internalNpmPath + '/grunt-browserify/tasks');
    grunt.task.loadTasks(internalNpmPath + '/grunt-text-replace/tasks');
    grunt.task.loadTasks(internalNpmPath + '/grunt-mocha-phantomjs/tasks');


    var tasks = [
        'clean:tmp',
        'copy:utility_test_files',
        'browserify:tests'
    ];

    if (keepalive) {
        // run test server!
        tasks.push('connect:test-server:keepalive');
    } else {
        tasks.push('connect:test-server');
        if (testType === 'mocha') {
            tasks.push('mocha_phantomjs');
        } else if (testType === 'qunit') {
            tasks.push('qunit:tests');
        }
        tasks.push('clean:tmp');
    }

    grunt.task.run(tasks);


};