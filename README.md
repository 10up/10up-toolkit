# 10up Scripts

A collection of bundled scripts for 10up development.

## Install
```
npm install --save-dev @10up/scripts
```

## Scripts

```
10up-scripts build
```

Builds CSS and JavaScript files. This uses the 10up configuration for Webpack.

```
10up-scripts start
```

Builds CSS and JavaScript and watches files for changes.

```
10up-scripts format-js
```

Fixes JavaScript formatting issues via ESLint with 10up configuration.

```
10up-scripts lint-js
```

Runs ESLint with 10up configuration

```
10up-scripts lint-style
```

Runs Stylelint with 10up configuration.

```
10up-scripts test-unit-jest
```

Runs Jest on current project.

```
10up-scripts check-engines
```

Verify the Node and npm satisfy minimum `package.json` versions.

*Project is a fork of [wp-scripts](https://github.com/WordPress/gutenberg/tree/master/packages/scripts)*

## Configuration and Extension

Under the hood 10up-scripts uses Webpack, Postcss, Stylelint, Jest, Babel, and Eslint. By default the package uses 10up standard configurations for all of these tools. However, configuration can be overrided or extended for each tool.

### Webpack

10up-scripts will use 10up standard Webpack configuration located in [/config/webpack.config.js](https://github.com/10up/10up-scripts/blob/master/config/webpack.config.js) UNLESS you define a Webpack config file in your project e.g. you have a `webpack.config.js` in your project root. If you just need to change entry points, see the Entry Points section below.

### ESLint

10up-scripts will use 10up standard ESLint configuration located in [/config/.eslintrc.js](https://github.com/10up/10up-scripts/blob/master/config/.eslintrc.js) which extends [@10up/eslint-config](https://github.com/10up/eslint-config) UNLESS you define a ESLint config file in your project e.g. you have a `.eslintrc.js` in your project root. 

### Stylelint

10up-scripts will use 10up standard Stylelint configuration located in [/config/stylelint.config.js](https://github.com/10up/10up-scripts/blob/master/config/stylelint.config.js) which extends [@10up/stylelint-config](https://github.com/10up/stylelint-config) UNLESS you define a Stylelint config file in your project e.g. you have a `stylelint.config.js` in your project root.

### PostCSS

10up-scripts will use 10up standard PostCSS configuration located in [/config/postcss.config.js](https://github.com/10up/10up-scripts/blob/master/config/postcss.config.js) UNLESS you define a PostCSS config file in your project e.g. you have a `postcss.config.js` in your project root.

### Babel

10up-scripts will use 10up standard Babel configuration of [@10up/babel-preset-default](https://github.com/10up/babel-preset-default) UNLESS you define a Babel config file in your project e.g. you have a `.babelrc` in your project root.

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

To override you will need to define `@10up/scripts.entry` in your `package.json` file. For example:

```json
{
    "@10up/scripts": {
        "entry": {
            "myEntry: "..."
        }
    }
}
```

## Support Level

**Active:** 10up is actively working on this, and we expect to continue work for the foreseeable future including keeping tested up to the most recent version of WordPress.  Bug reports, feature requests, questions, and pull requests are welcome.

## Like what you see?

<a href="http://10up.com/contact/"><img src="https://10updotcom-uploads.s3.amazonaws.com/uploads/2016/08/10up_github_banner-2.png" alt="Work with 10up, we create amazing websites and tools that make content management simple and fun using open source tools and platforms"></a>
