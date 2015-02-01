# grunt-build-tools

> Mark's build tools

## Getting Started
This plugin requires Grunt `~0.4.5`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-build-tools --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-build-tools');
```

## The "bt" task

### Overview
In your project's Gruntfile, add a section named `bt` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  bt: {
    options: {
      // Task-specific options go here.
    },
    uglifyFiles: {
      // the object mapping of files that should be uglified during build command
    },
    testRequireConfig: {
      // the requirejs configuration used for tests
    },
  },
});
```

### Options

#### options.uglifyFiles
Type: `Object`
Default value: `',  '`

An object mapping of files that should be uglified during build command,

#### options.testRequireConfig
Type: `Object`
Default value: `'.'`

An object to use as the requirejs configuration used for tests.