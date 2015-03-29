'use strict';
var Promise = require('promise');

module.exports = function(grunt) {
    grunt.registerTask('bt', 'Build tools.', function() {
        var command = this.args[0],
            args = Array.prototype.slice.call(arguments, 1),
            done = this.async(),
            config = grunt.config.get('bt'),
            commandPromise = Promise.resolve();
        if (command) {
            commandPromise = require('./../src/' + command)(config, args);
        } else if (!command) {
            grunt.log.error('you must specify a bt command');
        } else {
            grunt.log.error('there is no bt command named ' + command + '.');
        }
        commandPromise.then(done, function () {
            done(false);
        });
    });

};
