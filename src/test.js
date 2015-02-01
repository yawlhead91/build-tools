'use strict';

module.exports = function(grunt, args) {
    var testFiles = grunt.file.expand({filter: "isFile"}, ["tests/*"]);

    // turn testfiles into an string array for replace operation
    function convertToReplaceString(files) {
        var replaceStr = '[';
        files.forEach(function (str) {
            replaceStr += '\'' + str + '\'';
        });
        replaceStr += ']';
        return replaceStr;
    }

    var fs = require('fs');
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

    grunt.config.set('qunit', {
        local: {
            options: {
                urls: [
                    'http://localhost:7000/tests/index.html'
                ]
            }
        }
    });
    grunt.config.merge({
        connect: {
            test: {
                options: {
                    hostname: 'localhost',
                    port: 7000
                }
            },
            'test-server': {
                options: {
                    port: 7000,
                    hostname: '*',
                    base: ['.', 'tmp', 'tmp/tests'],
                    keepalive: true,
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
                        dest: 'tmp/tests',
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
                tasks: ['copy:test-files', 'replace:add-test-files'],
                options: {
                    spawn: false
                }
            }
        },
        replace: {
            add_test_files: {
                src: ['tmp/tests/tests.js'],
                dest: 'tmp/tests/tests.js',
                replacements: [{
                    from: '[TEST_FILES]',
                    to: convertToReplaceString(testFiles)
                }]
            }
        }
    });

    require('./../node_modules/grunt-contrib-qunit/tasks/qunit')(grunt);
    require('./../node_modules/grunt-contrib-connect/tasks/connect')(grunt);
    require('./../node_modules/grunt-contrib-watch/tasks/watch')(grunt);
    require('./../node_modules/grunt-contrib-clean/tasks/clean')(grunt);
    require('./../node_modules/grunt-contrib-copy/tasks/copy')(grunt);
    require('./../node_modules/grunt-text-replace/tasks/text-replace')(grunt);

    if (args[0] === 'server') {
        // make alias
        grunt.task.run([
            'clean:tmp',
            'copy:test-files',
            'replace:add_test_files',
            'connect:test-server',
            'watch:test-files'
        ]);
    } else {
        grunt.task.run([
            'connect:test',
            'qunit:local'
        ]);
    }


};