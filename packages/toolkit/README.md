# 10up-toolkit

A collection of bundled scripts for 10up development.

## Install
```
npm install --save-dev 10up-toolkit
```

## Scripts

```
10up-toolkit build
```

Builds CSS and JavaScript files. This uses the 10up configuration for Webpack. Check out the entry points below to see what is builds.

```
10up-toolkit start
```

Builds CSS and JavaScript and watches files for changes.

```
10up-toolkit format-js
```

Fixes JavaScript formatting issues via ESLint with 10up configuration.

```
10up-toolkit lint-js
```

Runs ESLint with 10up configuration

```
10up-toolkit lint-style
```

Runs Stylelint with 10up configuration.

```
10up-toolkit test-unit-jest
```

Runs Jest on current project.

```
10up-toolkit check-engines
```

Verify the Node and npm satisfy minimum `package.json` versions.

*Project is a fork of [wp-scripts](https://github.com/WordPress/gutenberg/tree/trunk/packages/scripts)*

## Configuration and Extension

Under the hood 10up-toolkit uses Webpack, Postcss, Stylelint, Jest, Babel, and Eslint. By default the package uses 10up standard configurations for all of these tools. However, configuration can be overrided or extended for each tool.



### Entry points

This package uses Webpack under the hood and uses the following entry points:
```
{
    admin: './assets/js/admin/admin.js',
    blocks: './includes/blocks/blocks.js',
    frontend: './assets/js/frontend/frontend.js',
    shared: './assets/js/shared/shared.js',
    styleguide: './assets/js/styleguide/styleguide.js',

    'admin-style': './assets/css/admin/admin-style.css',
    'editor-style': './assets/css/frontend/editor-style.css',
    'shared-style': './assets/css/shared/shared-style.css',
    style: './assets/css/frontend/style.css',
    'styleguide-style': './assets/css/styleguide/styleguide.css'
}
```

To override you will need to define `10up-toolkit.entry` in your `package.json` file. For example:

```json
{
    "10up-toolkit": {
        "entry": {
            "myEntry": ...
        }
	...
    }
}
```

### WordPress Dependecy Extraction

10up scripts will automatically run the [dependecy extraction plugin](https://developer.wordpress.org/block-editor/packages/packages-dependency-extraction-webpack-plugin/). If you don't want to run the dependecy extraction plugin you can disable it by setting a ENV var `TENUP_NO_EXTERNAL` or by setting the `wpDependencyExternals` setting to false in package.json.

```json
{
    "10up-toolkit": {
        "entry": {
            "myEntry: ...
        },
        "wpDependencyExternals": false
	...
    }
}
```


### Browsersync

10up Scripts starts Browsersync automatically. All you need to do is change `10up-toolkit.devURL` in your `package.json` to point to your local development URL:

```json
{
    "10up-toolkit": {
        "devURL": "https://project.test",
	...
    }
}
```

### Webpack

10up-toolkit will use 10up standard Webpack configuration located in [/config/webpack.config.js](https://github.com/10up/10up-toolkit/blob/trunk/packages/toolkit/config/webpack.config.js) UNLESS you define a Webpack config file in your project e.g. you have a `webpack.config.js` in your project root. If you just need to change entry points, see the Entry Points section below.

Here's an example `webpack.config.js` you could add to the root of your project to extend `10up/scripts` Webpack.

```js
const defaultConfig = require('10up-toolkit/config/webpack.config');
module.exports = {
	...defaultConfig,
	myObject: {
        stuffHere: true
    }
};
```

### ESLint

10up-toolkit will use 10up standard ESLint configuration located in [/config/.eslintrc.js](https://github.com/10up/10up-toolkit/blob/trunk/packages/toolkit/config/.eslintrc.js) which extends [@10up/eslint-config](https://github.com/10up/eslint-config) UNLESS you define a ESLint config file in your project e.g. you have a `.eslintrc.js` in your project root. 

### Stylelint

10up-toolkit will use 10up standard Stylelint configuration located in [/config/stylelint.config.js](https://github.com/10up/10up-toolkit/blob/trunk/packages/toolkit/config/stylelint.config.js) which extends [@10up/stylelint-config](https://github.com/10up/stylelint-config) UNLESS you define a Stylelint config file in your project e.g. you have a `stylelint.config.js` in your project root.

### PostCSS

10up-toolkit will use 10up standard PostCSS configuration located in [/config/postcss.config.js](https://github.com/10up/10up-toolkit/blob/trunk/packages/toolkit/config/postcss.config.js) UNLESS you define a PostCSS config file in your project e.g. you have a `postcss.config.js` in your project root.

### Babel

10up-toolkit will use 10up standard Babel configuration of [@10up/babel-preset-default](https://github.com/10up/babel-preset-default) UNLESS you define a Babel config file in your project e.g. you have a `.babelrc` in your project root.

## Support Level

**Active:** 10up is actively working on this, and we expect to continue work for the foreseeable future including keeping tested up to the most recent version of WordPress.  Bug reports, feature requests, questions, and pull requests are welcome.

## Like what you see?

<a href="http://10up.com/contact/"><img src="https://10up.com/uploads/2016/10/10up-Github-Banner.png" alt="Work with 10up, we create amazing websites and tools that make content management simple and fun using open source tools and platforms"></a>
