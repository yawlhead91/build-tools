'use strict';

var Promise = require('promise');
var connect = require('connect');
var serveStatic = require('serve-static');
var _ = require('underscore');

var server;
var serverPromise;

module.exports = function(options) {

    options = _.extend({
        port: 7000,
        staticDir: process.cwd()
    }, options);

    function stopServer() {
        return new Promise(function (resolve) {
            console.log('shutting down server...');
            if (server) {
                server.close();
            }
            resolve();
        });
    }

    function startServer() {
        serverPromise = new Promise(function (resolve) {
            // run test server!
            var app = connect();
            console.log('running server on http://localhost:' + options.port + '...');
            app.use(serveStatic(options.staticDir + '/'));
            //create node.js http server and listen on port
            server = app.listen(options.port);

            // when server is killed on UNIX-like systems, call close
            process.on('SIGINT', function() {
                stopServer().then(function () {
                    resolve();
                    process.exit();
                });
            });
            console.log('server started!');
        });
        return serverPromise;
    }

    return startServer();

};