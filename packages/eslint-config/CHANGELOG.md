# Changelog

All notable changes to this project will be documented in this file, per [the Keep a Changelog standard](http://keepachangelog.com/).

## [2.3.4]
- Treats @wordpress packages as core-modules in `@10up/eslint-config/wordpress`.
- Uses `'@typescript-eslint/no-use-before-define` instead of eslint `no-use-before-define` for typescript files.

## [2.3.3]
- Remove the rules for prop-type and prop-spreading in the wordpress config.

## [2.3.2]
- Disables eslint fixer for `jsdoc/require-param` due to a [bug](https://github.com/10up/10up-scripts/issues/17) with vscode where it would add duplicated params.

## [2.3.1]
- Fixes a bug with @babel/eslint-parser where it would complain about missing babel config.

## [2.3.0]
- Fixes a bug with NPM 7 by updating peer dependencies
- Removes babel-eslint in favor of @babel/eslint-parser, make sure you project have a babel config as the new babel eslint parser will use your project's babel config for linting.
