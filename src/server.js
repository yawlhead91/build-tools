'use strict';

var Promise = require('promise');
var express = require('express');
var serveStatic = require('serve-static');
var _ = require('underscore');
var http = require('http');

class Server {

    /**
     * Starts a server.
     * @param {Object} options - The server options
     * @param {Number} [options.port] - The port number to start the server on
     * @param {String} [options.staticDir] - The directory to serve static files
     * @param {String|Function} [options.middleware] - The path to the middleware file or the middleware function that is passed the app instance and called before server is ran
     * @param {Function|Promise} [options.onServerEnd] - Called before the server ends
     * @returns {Promise}
     */
    constructor (options) {
        
        options = _.extend({
            port: 7000,
            staticDir: process.cwd(),
            middleware: null,
            onServerEnd: null
        }, options);
        
        this.options = options;

        this.sockets = []; // keep track of sockets so we can destroy when done

        let app = express();
        console.log('running server on http://localhost:' + this.options.port + '...');
        if (this.options.middleware) {
            try {
                if (typeof this.options.middleware !== 'function') {
                    this.options.middleware = require(this.options.middleware)
                }
            } catch (err) {
                console.error(err);
                throw Error(err);
            }
            this.server = this.options.middleware(app);
        } else {
            // we can at least provide some basic functionality...sheesh
            app.use(serveStatic(this.options.staticDir + '/'));
        }
        //create node.js http server and listen on port
        this.server = this.server || http.createServer(app);

    }


    /**
     * Stops the server.
     * @returns {*}
     */
    stop () {
        return new Promise((resolve) => {
            console.log('shutting down server...');
            this.server.close(() => {
                let serverEnd = this.options.onServerEnd ? this.options.onServerEnd() : Promise.resolve();
                serverEnd.then(() => {
                    // destroy any sockets in use
                    if (this.sockets.length) {
                        this.sockets.forEach((s) => {
                            s.destroy();
                        });
                    }
                    resolve();
                });
            });
        });
    }

    /**
     * Starts the server.
     * @returns {Promise}
     */
    start () {
        this.server.on('connection', (socket) => {
            this.sockets.push(socket);
        });
        this.server.listen(this.options.port);
        // handle when server is killed on UNIX-like systems...
        process.on('SIGINT', () => {
            this.stop().then(() => {
                // listening to the SIGINT stops node's default exiting,
                // so we must do it manually here
                process.exit();
            });
        });
        console.log('server started!');
        return Promise.resolve();
    }
}

module.exports = Server;
