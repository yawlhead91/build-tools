'use strict';

var Promise = require('promise');
var connect = require('connect');
var serveStatic = require('serve-static');

var server;
var serverPromise;

module.exports = function() {

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
        var port = 7000;
        serverPromise = new Promise(function (resolve) {
            // run test server!
            var app = connect();
            console.log('running server on http://localhost:' + port + '...');
            app.use(serveStatic(process.cwd() + '/'));
            //create node.js http server and listen on port
            server = app.listen(port);

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