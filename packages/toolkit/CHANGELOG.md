# Changelog

All notable changes to this project will be documented in this file, per [the Keep a Changelog standard](http://keepachangelog.com/).

## 1.0.12
- Fixed: BrowserSync Config [#105](https://github.com/10up/10up-toolkit/pull/105)
- Fixed: webpack watch command [#105](https://github.com/10up/10up-toolkit/pull/105)
- Updated deps

## 1.0.11
- Fixed: Allows passing a `--port` flag to browser-sync `10up-toolkit start|watch --port=3002` [#95](https://github.com/10up/10up-toolkit/pull/95)
- Fixed: dev-server public path [#98](https://github.com/10up/10up-toolkit/pull/98)

## 1.0.10
- Fixed empty scripts output when a CSS entry is added.[#91](https://github.com/10up/10up-toolkit/pull/91)

## 1.0.9
- Updated deps [82](https://github.com/10up/10up-toolkit/pull/82)
- Remove husky from 10up-toolkit [81] (Updated: Husky to 6.x)

## 1.0.8
- Fixed PostCSS nested plugin. props @rdimascio
- Fixed: Typo in HtmlWebpackPlugin where it was looking for the template in pulic folder instead of folder. Additionally, it now only defines a custom template if it is defined in the project.

## 1.0.7
- Fixed: Babel error when running jest. [#71](https://github.com/10up/10up-toolkit/pull/71)
- Added: Webpack Dev Server [#70](https://github.com/10up/10up-toolkit/pull/70)
## 1.0.6
- Fixed: webpack externals definitions [#67](https://github.com/10up/10up-toolkit/pull/67)

## 1.0.5
- Fixed: Regex in asset/resources. [#63](https://github.com/10up/10up-toolkit/pull/63)
- Fixed: Babel transpilation for publishing packages `["sourceType": "unambiguous"]`. [#63](https://github.com/10up/10up-toolkit/pull/63)
- Fixed: Webpack Externals definition [#63](https://github.com/10up/10up-toolkit/pull/63)
- Update: Prettier to 1.3.0 and stop using version range. [#64](https://github.com/10up/10up-toolkit/pull/64)
- Added: Support for CSS Modules. [#65](https://github.com/10up/10up-toolkit/pull/65)

## 1.0.4
- Exit with an error code if build fails

## 1.0.3
- Update @10up/eslint-config to 2.3.5
- Update @10up/babel-preset-defaylt to 1.1.2
- Add TypeScript support

## 1.0.2
- Update @10up/stylelint-config to 1.1.1

## 1.0.1
- Adds cache busting to chunk files generated via Webpack code splitting.
- Added support for SCSS and Sass files.

## 1.0.0

- Adds support for authoring libraries.

## Pre 10up-toolkit

## 1.3.4
- Deprecate 10up-scripts command and exposes a new 10up-toolkit command.

## 1.3.3
- Disables webpack css-loader url resolution [#39](https://github.com/10up/10up-scripts/pull/39)
- Only load and run the postcss-editor-styles plugin when processing editor-style.css [#41](https://github.com/10up/10up-scripts/pull/41)

## 1.3.2
- Fixes a bug where webpack was not targeting the same browsers as babel, causing code to not run on older browsers like IE 11. [#35](https://github.com/10up/10up-scripts/pull/35)
- Updates eslint to 2.3.4 to address [#27](https://github.com/10up/10up-scripts/issues/27)
- Updates postcss.config.js to include missing packages and to fix a bug where editor styles wasn't being wrapped with the `.editor-styles-wrapper` class.