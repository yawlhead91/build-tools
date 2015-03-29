# Build Tools

A set of javascript tasks to help speed up packaging and building processes.

## Contents

1. [Dependencies](#dependencies)
1. [CLI Commands](#cli-commands)
    * [bt test](#bt-test)
1. [Grunt Tasks](#grunt-tasks)
    * [grunt bt:test](#grunt-bt-test)

## Dependencies

### Node

You can install [Node.js](http://www.nodejs.org/) via the package provided on [their site](http://www.nodejs.org). Installing node will also install the [Node Package Manager](https://github.com/npm/npm) (NPM) to download and install node modules.


## CLI Commands

Installing Build Tools as a global module will give you command-line access to all tasks available.

You can install globally by typing the following in your terminal

```
npm install build-tools  -g
```

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