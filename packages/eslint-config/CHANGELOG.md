# Changelog

## 3.1.1

### Patch Changes

- a930021: Fix: prettier peerDependency range

## 3.1.1-next.0

### Patch Changes

- a930021: Fix: prettier peerDependency range

## 3.1.0

### Minor Changes

- f3122e4: Updating several dependencies
  Better error messages when svg parsing fails

### Patch Changes

- Updated dependencies [f3122e4]
  - @10up/babel-preset-default@2.1.0

## 3.0.0

### Major Changes

- 0f29b56: Updating dependencies.

## 2.4.7

### Patch Changes

- 010cea6: Updating package.json links to point to the new repository
- Updated dependencies [010cea6]
  - @10up/babel-preset-default@2.0.4

## 2.4.6

### Patch Changes

- @10up/babel-preset-default@2.0.3

All notable changes to this project will be documented in this file, per [the Keep a Changelog standard](http://keepachangelog.com/).

## 2.4.5

- Updated: Included `react` and `react-dom` as core modules in the `wordpress` config. This was done as WP is responsible for loading them.

## 2.4.3

- Reverted - 10up's eslint plugin

## 2.4.2

- Changed - Updated prettier config to rename jsxBracketSameLine to bracketSameLine (https://prettier.io/blog/2021/09/09/2.4.0.html) [#149](https://github.com/10up/10up-toolkit/pull/149)
- Changed - Dropped `@wordpress/eslint-plugin` in favor of `@10up/eslint-plugin`. [#153](https://github.com/10up/10up-toolkit/pull/153)

## 2.4.0

- Updated eslint-config-airbnb-base and eslint-config-airbnb
- Updated to eslint 8

## 2.3.8

- Updated dependencies

## 2.3.7

- Updated deps

## 2.3.6

- Updated deps [82](https://github.com/10up/10up-toolkit/pull/82)

## 2.3.4

- Treats @wordpress packages as core-modules in `@10up/eslint-config/wordpress`.
- Uses `'@typescript-eslint/no-use-before-define` instead of eslint `no-use-before-define` for typescript files.

## 2.3.3

- Remove the rules for prop-type and prop-spreading in the wordpress config.

## 2.3.2

- Disables eslint fixer for `jsdoc/require-param` due to a [bug](https://github.com/10up/10up-scripts/issues/17) with vscode where it would add duplicated params.

## 2.3.1

- Fixes a bug with @babel/eslint-parser where it would complain about missing babel config.

## 2.3.0

- Fixes a bug with NPM 7 by updating peer dependencies
- Removes babel-eslint in favor of @babel/eslint-parser, make sure you project have a babel config as the new babel eslint parser will use your project's babel config for linting.
