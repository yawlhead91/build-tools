'use strict';

var glob = require('glob');
var fs = require('fs');

var extRootPath = process.cwd();
var intRootPath = extRootPath + '/node_modules/grunt-build-tools';

module.exports = function(grunt, args) {
    var config = grunt.config.get('bt') || {},
        testsConfig = config.tests || {},
        testType = args[0],
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
            'tests': {
                files: [
                    {
                        src: testsConfig[testType] ? testsConfig[testType].src : [],
                        dest: 'tmp/tests/' + testType + '/built-tests.js'
                    }
                ],

                options: extend({}, config.options, {
                    alias: [
                        './tmp/tests/qunit/qunit.js:qunit',
                        './tmp/tests/test-utils.js:test-utils'
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
    grunt.task.loadNpmTasks('grunt-contrib-clean');
    grunt.task.loadNpmTasks('grunt-contrib-qunit');
    grunt.task.loadNpmTasks('grunt-contrib-connect');
    grunt.task.loadNpmTasks('grunt-contrib-clean');
    grunt.task.loadNpmTasks('grunt-contrib-copy');
    grunt.task.loadNpmTasks('grunt-text-replace');
    grunt.task.loadNpmTasks('grunt-browserify');
    grunt.task.loadNpmTasks('grunt-mocha-phantomjs');


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