# Changelog

All notable changes to this project will be documented in this file, per [the Keep a Changelog standard](http://keepachangelog.com/).

## 4.0.0
- Changed: 10up-toolkit no longer transpiles `@10up/block-components`. Make sure to use the latest version of `@10up/block-components` that already ships transpiled code. [#181](https://github.com/10up/10up-toolkit/pull/181)
- Changed [BREAKING CHANGE]: Stop injecting `wp-polyfill` as dependecy of scripts built by 10up-toolkit. [#193](https://github.com/10up/10up-toolkit/pull/193).
- Updated: Dependencies [#182](https://github.com/10up/10up-toolkit/pull/182)
- Changed [BREAKING CHANGE]: Stylelint and eslint are now peerDependencies. This is a breaking change only for those not using npm >= 7. [#179] (https://github.com/10up/10up-toolkit/pull/179)

## 3.1.0
- Fixed: `dev-server` flag [#178](https://github.com/10up/10up-toolkit/pull/178)
- Added: `--target` option [#176](https://github.com/10up/10up-toolkit/pull/175)
- Added: Basic support for `exports` package.json field in package mode. [#170](https://github.com/10up/10up-toolkit/pull/170)

## 3.0.3
- Changed - Updated `@wordpress/eslint-plugin` to 11.0.0 to resolved an issue with conflicting prettier deps.

## 3.0.2
- Reverted - 10up's eslint plugin

## 3.0.0
- Added - Introduced the `--analyze` option to the build to enable webpack-bundle-analyzer [#148](https://github.com/10up/10up-toolkit/pull/148)
- Added - Introduced HMR and React Fast Refresh [#150](https://github.com/10up/10up-toolkit/pull/150)
- Added - Introduced `TenUpToolkitTscPlugin` that runs tsc both on build and watch if tsconfig.json is present. [#151](https://github.com/10up/10up-toolkit/pull/161)
- Changed - Eslint and stylelint now only lint changed files when building with webpack (lintDirtyModulesOnly) [#146](https://github.com/10up/10up-toolkit/pull/146)
- Changed - Replaced `imagemin-webpack-plugin` with `image-minimizer-webpack-plugin` [#147](https://github.com/10up/10up-toolkit/pull/147)
- Changed - Droped `imagemin` in favor of `squoosh` [#157](https://github.com/10up/10up-toolkit/pull/157)
- Changed - Updated `@svgr/webpack` to 6.2.1 and removed `postcss-object-fit-image` as it's not necessary.
- Deprecated - BrowserSync [#159](https://github.com/10up/10up-toolkit/pull/159)

## 2.1.0
- Fix double dot issue in CopyWebpack plugin
- Stop removing viewbox in svgs.
- Added `.ico` and ` .otf` files to be copied via copy-webpack-plugin.
- Updated eslint-config and eslint to 8.

## 2.0.0
- Updated several dependencies.
- Updated to postcss-preset-env 7.0 and switched from postcss-nested to postcss-nesting (BREAKING CHANGE)
- Disable polyfill for CSS custom properties.
- Removed wordpress/jest-preset-default and now shipping a custom jest config. Jest has also been updated to the latest version.

## 1.0.13
- [Security] Updated deps

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
