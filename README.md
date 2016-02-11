[![Build Status](https://travis-ci.org/mkay581/build-tools.svg?branch=master)](https://travis-ci.org/mkay581/build-tools)

# Build Tools

A set of javascript tasks to help speed up packaging and building processes.

## Contents

1. [Dependencies](#dependencies)
1. [CLI Commands](#cli-commands)
    * [bt server](#bt-server)
    * [bt build](#bt-build)
    * [bt test](#bt-test)
    * [bt version](#bt-version)
1. [Grunt Tasks](#grunt-tasks)
    * [grunt bt:server](#grunt-bt-server)
    * [grunt bt:build](#grunt-bt-build)
    * [grunt bt:test](#grunt-bt-test)

## Dependencies

### Node

You can install [Node.js](http://www.nodejs.org/) via the package provided on [their site](http://www.nodejs.org). Installing node will also install the [Node Package Manager](https://github.com/npm/npm) (NPM) to download and install node modules.


## CLI Commands

Installing Build Tools as a global module will give you command-line access to all tasks available.

You can install globally by typing the following in your terminal:

```
npm install build-tools  -g
```

### bt server

To start a local server on port 8200 that serves the "blah" directory in your project using your own custom middleware myServer.js file,
just run the following command (all arguments are optional):

```
bt server --port=8200 --staticDir=./blah middleware=./myServer.js
```

Providing no arguments will serve the root directory of your project on localhost via port 7000, and use express's standard middleware by default.

### bt build

The build command will compile your application's js files using browserify. First you need to specify the files you
want the build command to use in your `bt-config.js` file.

For instance, if you wanted to build `src/main.js` (your entry file) into a final `dist/app.js` file,
specify the following in your `bt-config.js` file:

```javascript
module.exports = {
    build: {
        files: {
            'dist/app.js': ['src/main.js']
        }
    },
};
```

Then you can run the build command in your terminal:

```
bt build
```

#### Building for local development

By default, the build assumes a "production" build and does not watch your files as you edit them. If you want your files
to be "watched" and built on the fly as you edit them, pass the `local` option when running the terminal command like this:

```
bt build local
```

And of course you can pass the same arguments with the call to customize:

```
bt build local --port=6500 --staticDir=./build
```

Arguments allowed are:

| Argument | Type | Description |
|--------|--------|--------|
| `port`| Number| The port number to start the server on (if `local` is passed)
| `staticDir`| String | The path (relative to he project root) containing the files that should be served when the server starts


#### Requiring files

There are also configuration options you can specify in your configuration like `requires`, which will ensure
that any external scripts are preloaded. See [https://github.com/substack/node-browserify#brequirefile-opts](browserify
require documentation) to understand why you may want to do this. Here is an example of a configuration. All paths are
relative to your project's root.

```javascript
{
    build: {
           requires: [
                "./app/my-script"
            ]
        }
}
```

Or you can specify an object for your requires to expose reusable variables:

```javascript
{
    build: {
           requires: {
            "my-code": "./app/my-script"
           }
        }
}
```

Then you can reference `my-code` anywhere in your bundled script files.


### bt test

The `test` command will run all tests in any given project. The following test files are supported:

  * [QUnit](http://qunitjs.com/)
  * [Mocha](https://github.com/mochajs/mocha)

Make sure you have the `tests` configuration setup in your `bt-config.js` file like below:


```javascript
module.exports = {
    "tests": {
        "qunit": {
          "src": ["tests/**/*"],
        },
        "mocha": {
          "src": ["path/to/mocha/tests/*"]
        }
      }
};
```

Once that's done, just run the following in your terminal:

```
bt test
```

The command will run all test files you have specified in your configuration file, headlessly.

You also have the option of running tests in the browser by doing:

```
bt test qunit server
```

Which will run your tests in the browser located at http://localhost:7755.

### bt version

The `version` command is a just a cheap imitation of [npm's version command](https://docs.npmjs.com/cli/version). You
don't need any fancy configuration. Just run the following command:

```
bt version [SEMVER]
```

Replacing [SEMVER] with (`major`, `minor` or `patch`) (`patch` is the default if nothing is supplied).

Running this command will:

1. Update all relevant package files (`package.json` and `bower.json` if exists) to the new version
1. Commit the change to your local git repository (the commit message being your new version number)
1. Check out your master branch
1. Merge the branch you were on into your `master` branch
1. Push your `master` branch remotely to Github
`. Create a new tag of your new version
`. Push new tag to remote
1. Check back out the branch where you initially called the `version` command.

It is recommended to only run this command when you're on `master` or your "production" branch, since that is where all
relevant commits have already been committed, and is less likely to have convoluted commits that you might not want in
your new version.

## Grunt Tasks

If you would like to use Build Tools via grunt commands, you must first install Build tools locally:

```
npm install build-tools
```

Then load the grunt tasks by adding the following to your `Gruntfile.js`:

```javascript
grunt.loadNpmTasks('build-tools');
```

The any of the following commands can be ran.

### grunt bt:server

Same as the [`bt server`](#bt-server) command using grunt.

```shell
grunt bt:server
```

### grunt bt:build

Same as the [`bt build`](#bt-build) command using grunt.

```shell
grunt bt:build
```


### grunt bt:test

This test command is just the [`bt test`](#bt-test) command that can be ran via grunt,
To use this command, just setup your `Gruntfile.js` file with the following.

For example, if you wanted to run all nodeunit tests on the project that reside in the `test/` folder in your project,
you would use the following grunt configuration.

```javascript
'bt': {
    "tests": {
        "mocha": {
            "src": ["tests/mocha/*"]
        }
    }
}
```

Then you can run:

```shell
grunt bt:test
```
