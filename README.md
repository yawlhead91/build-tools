[![Build Status](https://travis-ci.org/mkay581/build-tools.svg?branch=master)](https://travis-ci.org/mkay581/build-tools)
[![npm version](https://badge.fury.io/js/build-tools.svg)](https://badge.fury.io/js/build-tools)

# Build Tools

A set of CLI commands to quickly version, package, and compile your projects.

## Benefits

* Compiles all JS files using [Browserify](https://github.com/substack/node-browserify)
* Transpiles all files using [Babel](https://github.com/babel/babel) to support latest ES code
* Supports [SASS](http://sass-lang.com/) files (.scss)
* Includes a built-in node server that allows for optional middleware
* Full Git and NPM integration; Packages projects by creating git version tags, pushing to master branch, and versioning your project as a NPM package
* Built-in Mocha and QUnit test runners
* Deploys to a server (SFTP)

## Contents

1. [Dependencies](#dependencies)
1. [CLI Commands](#cli-commands)
    * [bt server](#bt-server)
    * [bt build](#bt-build)
    * [bt test](#bt-test)
    * [bt release](#bt-release)
    * [bt version](#bt-version)
    * [bt deploy](#bt-deploy)

## Dependencies

### Node

This package requires Node >=6.0.

You can install [Node.js](http://www.nodejs.org/) via the package provided on [their site](http://www.nodejs.org).
Installing node will also install the [Node Package Manager](https://github.com/npm/npm) (NPM) to download and
install node modules.


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

You can also start a server based on configuration that you specify in your bt-config.js file.

```js
module.exports = {
    production: {
        server: {
           hostname: 'localhost',
           staticDir: './blah',
           middleware: './myServer.js',
           port: 8200
        }
    },
};

```

Then you can just run `bt server production`.

### bt build

The `build` command builds all of your files into a distribution folder for deployment.
It will do things like compile all of your application's javascript files into single files using browserify (ES6 files are supported), 
sassify all of your scss files, minify files, and even add banners to your files if desired.

First you need to specify the files you want the build command to use in your `bt-config.js` file. For instance, 
if you wanted to build both a main.js file and a scss file into a folder called `dist`, then minify the js file, your `bt-config.js` file would look a little like this:

```javascript
module.exports = {
    production: {
        build: {
            files: {
                'dist/app.js': ['src/main.js'],
                'dist/styles.css': ['src/styles/main.scss']
            },
            minifyFiles: {
                'dist/app.js': ['dist/app.js']
            },
            requires: {
                "my-code": "./app/my-script" // makes 'my-code' as a global package name in your bundle
            },
            "browserifyOptions": {},
            watch: false
        }
    },
};
```
#### Build Options

| Option | Type | Description |
|--------|--------|--------|
| `files`| Object | An object containing a mapping of output files (keys) to their source files (values)
| `minifyFiles`| Object | An object containing a mapping of output files (keys) to the files that should be minified (values)
| `requires`| Array|Object | An array containing which files to ensure are loaded externally and made available in the build. See [https://github.com/substack/node-browserify#brequirefile-opts](browserify's require option) to understand why you may want to use this. This option can also be an object containing require variable (keys) to their paths (values)
| `browserifyOptions`| Object | [Browserify options](https://github.com/substack/node-browserify#brequirefile-opts). 
| `watch`| Boolean | Whether to watch the built files for changes and rebuilt afterwards. Defaults to false. 


Then you can run the build command in your terminal:

```
bt build
```

#### Running builds for local development

By default, the `build` command assumes a "production" build, will run production tests (if specified in your bt-config.js file) 
and does not watch your files as you edit them. 
If you want your files to be "watched" and built on the fly as you edit them, pass the `local` option when running the 
terminal command like this:

```
bt build local
```

And of course you can pass the same [build arguments](#build-options) as mentioned above:

```
bt build local --port=6500 --staticDir=./build
```

Arguments allowed are:

| Argument | Type | Description |
|--------|--------|--------|
| `port`| Number| The port number to start the server on (if `local` is passed)
| `staticDir`| String | The path (relative to he project root) containing the files that should be served when the server starts
| `watch`| Boolean | Whether to watch the files and rebuild if necessary. Defaults to true.

#### NODE_ENV variable

Because the `bt build` command compiles before being available in the browser, this command will inject your current
environment variable into the `process.env.NODE_ENV` variable in your javascript. So you can do things like the
following, even in your client-side files!

```js
if (process.env.NODE_ENV === 'production') {
    // do things for production environment
} else {
    // do things for non-production environment
}
```
Remember that this variable will be either the `env` variable you pass into your `bt build` call or the REAL `NODE_ENV` variable
in your environment.

### bt test

The `test` command will run all tests in any given environment. The following test files are supported:

  * [QUnit](http://qunitjs.com/)
  * [Mocha](https://github.com/mochajs/mocha)

Make sure you have the `tests` configuration setup in your `bt-config.js` file like below:


```javascript
module.exports = {
    production: {
        "tests": {
            "qunit": {
              "src": ["tests/**/*"],
            },
            "mocha": {
              "src": ["path/to/mocha/tests/*"],
            },
            "browserifyOptions": {}
          }
    }
};

```

#### Options

| Option | Type | Description |
|--------|--------|--------|
| `qunit`| Object | Options to use for qunit test compiling
| `qunit.src`| Array | An array of file names (or [glob patterns](https://github.com/isaacs/node-glob)) to be compiled and tested using QUnit  
| `mocha`| Object | Options to use for mocha tests
| `mocha.src`| Array | An array of file names (or [glob patterns](https://github.com/isaacs/node-glob)) to be compiled and tested using Mocha 
| `browserifyOptions`| Object | [Browserify options](https://github.com/substack/node-browserify#brequirefile-opts).  


Once that's done, just run the following in your terminal:

```
bt test
```

The command will run all test files you have specified in your production configuration, headlessly.

You also have the option of running tests in the browser by doing:

```
bt test qunit server
```

Which will run your tests in the browser located at http://localhost:7755.

### bt release

The `release` command is a way to official bundle and make a version of your package. You can think of this command as a much more strict, 
authoritative version of [version command](#bt-version).

```
bt release [SEMVER]
```

Replacing [SEMVER] with (`major`, `minor` or `patch`) (`patch` is the default if nothing is supplied).

The `bt release` command does the following:

1. Runs all [production tests](#bt-test), if specified.
1. Runs a [production build](#bt-build), if specified.
1. Ups the version of the package, which involves the exact same steps performed by the [version command](#bt-version).
1. Publishes package to npm.
1. Release is published to Github, if your [github credentials are setup in your bt-config file](#github-integration).
1. Notifications are automatically sent out to all who are watchers of the git repo notifying them of the new version.

`bt release` arguments can be passed with command:

```
bt release --draft=true
```

| Argument | Type | Description |
|--------|--------|--------|
| `draft`| Boolean| `true` to upload release to Github as "unpublished", `false` otherwise (defaults to `false`)
| `prerelease`| Boolean | `true` to mark release as "pre" (defaults to `false`)

#### Github Integration

In order to have your release published on github, you must [generate a github token](https://help.github.com/articles/creating-an-access-token-for-command-line-use/)
and add it under the `github` property of your bt-config file:

```javascript
module.exports = {
    "github": {
       "token": "s65495jkgljkgskjfdigf", // the generated github token
       "user": "githubUserName", // the github username that contains the access token
       "repo": "my-repo", // the github repo name (optional, assumes local repository)
    }
};
```

You can also pass github arguments to the cli command:

```
bt release --user=githubUserName --repo=my-repo --token=s65495jkgljkgskjfdigf
```

### bt version

The `version` command is a just a cheap imitation of [npm's version command](https://docs.npmjs.com/cli/version). It marks your code at a particular version.
 No tests are run and no build is created and you don't need any fancy configuration. Just run the following command:

```
bt version [SEMVER]
```

Replacing [SEMVER] with (`major`, `minor` or `patch`) (`patch` is the default if nothing is supplied).

Running this command will:

1. Update `package.json` to the new version
1. Create a local git commit (you will be prompted for a commit message)
1. Create a new tag of your new version
1. Push new tag to your git repository
1. Check out your master branch
1. Merge the branch you were on into your `master` branch
1. Push your `master` branch remotely to Github
1. Check back out the branch where you initially called the `version` command.

It is recommended to only run this command when you're on `master` or a branch ready for production, since that is where all
relevant commits have already been committed, and is less likely to have convoluted commits that you might not want in
your new version.

### bt deploy

The `bt deploy` command allows you to upload files to a server of your choosing.

You can pass options as arguments to your cli command:

```
bt deploy --hostname=555.555.555.55 --port=22 --path=dist --username=user --password=secret
```

or you can specify the options in your `bt-config.js` file


```js
module.exports = {
    deploy: {
       hostname: '555.555.555.55',
       username: 'user',
       password: 'secret',
       path: 'dist',
       protocol: 'sftp',
       port: 22,
       exclude: [
           '.gitignore',
           'node_modules/**'
       ]
    }
};

```
Then you can just run `bt deploy`.

If you need to have a deploy configuration for multiple environments, you can just nest your configuration under
the id of the environment. The example below assigns the deploy configuration to the `production` environment.

```js
module.exports = {
    deploy: {
        production: {
           hostname: '555.555.555.55',
           username: 'user',
           password: 'secret',
           path: 'dist',
           protocol: 'sftp',
           port: 22,
        }
    }
};

```

Then just run `bt deploy production`.


## Packaging

When running any of the commands that package your project (i.e. `bt build`, `bt release`, etc), this lib takes care
of determining what file types are a part of your build and spawns off different compilation tasks outlined below.

### SASS files

When detecting a file with a .scss extension, it is compiled into the new css file that you specify in your bt-config file.
It will also do some small but helpful tasks like add any necessary vendor prefixes to your css and minify it for
performance. It does also make a css.map file which you can use when debugging or viewing the source.


## Development

### Run tests

```
npm install
npm test
```
