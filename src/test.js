'use strict';

var rootPath = process.cwd();

module.exports = function(grunt, args) {
    var testFiles = grunt.file.expand({filter: "isFile", cwd: 'tests/'}, ["**/*.js"]),
        fs = require('fs'),
        btConfig = grunt.config.get('bt') || {},
        testRequireConfig = btConfig.testRequireConfig || {};

    // turn testfiles into an string array for replace operation
    function convertToReplaceString(files) {
        var replaceStr = '[';
        files.forEach(function (str, idx) {
            if (idx > 0) {
                replaceStr += ','
            }
            replaceStr += '\'' + 'files/' + str + '\'';

        });
        replaceStr += ']';
        return replaceStr;
    }

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

    // compiles the tests.js file that is run
    function compileTestFileContent() {
        var config = {
            baseUrl: '../',
            paths: extend({}, testRequireConfig.paths, {
                qunit: 'tests/libs/qunit/qunit-require',
                sinon: 'tests/libs/sinon/sinon',
                'test-utils': 'tests/test-utils'
            }),
            shim: extend({}, testRequireConfig.shim, {
                sinon: {
                    exports: 'sinon'
                }
            })
        };

        var content = '"use strict"; ' +
            'require.config(' + JSON.stringify(config) + ');' +
        'require(' + convertToReplaceString(testFiles) + ', function() {' +
            'QUnit.config.requireExpects = true;' +
            'QUnit.start();' +
        '});';

        return content;
    }

    grunt.config.merge({
        qunit: {
            local: {
                options: {
                    urls: [
                        'http://localhost:7755/index.html'
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
                        // when server is killed on UNIX-like systems, call close, so we can remove tmp directory
                        process.on('SIGINT', function() {
                            server.close();
                        });
                        server.on('close', function() {
                            // remove tmp directory
                            deleteFolderRecursive('tmp');
                        });
                    }
                }
            }
        },
        clean: {
            tmp: ['tmp']
        },
        copy: {
            'test-files': {
                files: [
                    {
                        expand: true,
                        cwd: 'tests',
                        dest: 'tmp/tests/files',
                        src: [
                            '**/*.js'
                        ]
                    },
                    {
                        expand: true,
                        cwd: 'node_modules/grunt-build-tools/tests',
                        dest: 'tmp/tests',
                        src: [
                            '**/*'
                        ]
                    }
                ]
            }
        },
        watch: {
            'test-files': {
                files: ['tests/**/*.js'],
                tasks: ['copy:test-files'],
                options: {
                    spawn: false
                }
            }
        }
    });

    require(rootPath + '/node_modules/grunt-contrib-qunit/tasks/qunit')(grunt);
    require(rootPath + '/node_modules/grunt-contrib-connect/tasks/connect')(grunt);
    require(rootPath + '/node_modules/grunt-contrib-watch/tasks/watch')(grunt);
    require(rootPath + '/node_modules/grunt-contrib-clean/tasks/clean')(grunt);
    require(rootPath + '/node_modules/grunt-contrib-copy/tasks/copy')(grunt);
    require(rootPath + '/node_modules/grunt-text-replace/tasks/text-replace')(grunt);

    grunt.registerTask('compile_test_content', 'custom file compiler', function () {
        grunt.file.write('tmp/tests/tests.js', compileTestFileContent());
    });

    if (args[0] === 'server') {
        // make alias
        grunt.task.run([
            'clean:tmp',
            'copy:test-files',
            'compile_test_content',
            'connect:test-server:keepalive',
            'watch:test-files'
        ]);
    } else {
        grunt.task.run([
            'clean:tmp',
            'copy:test-files',
            'compile_test_content',
            'connect:test-server',
            'qunit:local',
            'clean:tmp'
        ]);
    }


};