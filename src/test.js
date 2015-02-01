'use strict';

var rootPath = process.cwd();

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

    require(rootPath + '/node_modules/grunt-contrib-qunit/tasks/qunit')(grunt);
    require(rootPath + '/node_modules/grunt-contrib-connect/tasks/connect')(grunt);
    require(rootPath + '/node_modules/grunt-contrib-watch/tasks/watch')(grunt);
    require(rootPath + '/node_modules/grunt-contrib-clean/tasks/clean')(grunt);
    require(rootPath + '/node_modules/grunt-contrib-copy/tasks/copy')(grunt);
    require(rootPath + '/node_modules/grunt-text-replace/tasks/text-replace')(grunt);

    if (args[0] === 'server') {
        // make alias
        grunt.task.run([
            'clean:tmp',
            'copy:test-files',
            'replace:add_test_files',
            'connect:test-server:keepalive',
            'watch:test-files'
        ]);
    } else {
        grunt.task.run([
            'clean:tmp',
            'copy:test-files',
            'replace:add_test_files',
            'connect:test-server',
            'qunit:local',
            'clean:tmp'
        ]);
    }


};