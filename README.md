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
