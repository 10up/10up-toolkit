# Changelog

## 5.2.2

### Patch Changes

- d3ea57e: install @wordpress/eslint-plugin in toolkit by default

## 5.2.2-next.0

### Patch Changes

- d3ea57e: install @wordpress/eslint-plugin in toolkit by default
- Updated dependencies [b172081]
  - @10up/stylelint-config@2.0.5-next.0

## 5.2.1

### Patch Changes

- a930021: Fix: prettier peerDependency range
- d3e6078: fix coply all php files inside the blocks directory into dist

## 5.2.1-next.1

### Patch Changes

- a930021: Fix: prettier peerDependency range
- Updated dependencies [a930021]
  - @10up/eslint-config@3.1.1-next.0

## 5.2.1-next.0

### Patch Changes

- d3e6078: fix coply all php files inside the blocks directory into dist

## 5.2.0

### Minor Changes

- f3122e4: Updating several dependencies
  Better error messages when svg parsing fails

## 5.1.0

### Minor Changes

- 799afd5: Introduce support for Linaria (css-in-js) in toolkit.
- b682822: maybe insert style version hash to dist block.json files

### Patch Changes

- 7ee697b: Ensuring stylelint supports SCSS in a separate ruleset
- cb5d528: Fix: checking chunk path for block decision.
  Fix: Windows related issues
- Updated dependencies [7ee697b]
  - @10up/stylelint-config@2.0.4

## 5.1.0-next.0

### Minor Changes

- 799afd5: Introduce support for Linaria (css-in-js) in toolkit.
- b682822: maybe insert style version hash to dist block.json files

### Patch Changes

- 7ee697b: Ensuring stylelint supports SCSS in a separate ruleset
- cb5d528: Fix: checking chunk path for block decision.
  Fix: Windows related issues
- Updated dependencies [7ee697b]
  - @10up/stylelint-config@2.0.4-next.0

## 5.0.0

### Patch Changes

- Updated dependencies [0f29b56]
  - @10up/eslint-config@3.0.0
  - @10up/babel-preset-default@2.0.4
  - @10up/stylelint-config@2.0.3

## 4.3.1

### Patch Changes

- 010cea6: Fix processing order whenever Sass is used
- Updated dependencies [010cea6]
  - @10up/babel-preset-default@2.0.4
  - @10up/eslint-config@2.4.7
  - @10up/stylelint-config@2.0.2

## 4.3.0

### Minor Changes

- 45d73c4: Introduce `--include` option to instruct toolkit to transpile the specified package
- 45d73c4: Add "none" format. Allowing to use "project mode" without producing a bundle that needs to be consumed through another bundler.

### Patch Changes

- 45d73c4: Improve Sass compatibility by making sure PostCSS runs after Sass has finished and also ensuring that PostCSS process the Sass pipeline.

  Fixes #198
  Fixes #228

- 45d73c4: Forks webpack-remove-empty-script into 10up-toolkit and remove the ansis dependency.

## 4.3.0-next.0

### Minor Changes

- c2298c3: Introduce `--include` option to instruct toolkit to transpile the specified package
- 24a50b8: Add "none" format. Allowing to use "project mode" without producing a bundle that needs to be consumed through another bundler.

### Patch Changes

- c7ddd46: Improve Sass compatibility by making sure PostCSS runs after Sass has finished and also ensuring that PostCSS process the Sass pipeline.

  Fixes #198
  Fixes #228

- aec9ac4: Forks webpack-remove-empty-script into 10up-toolkit and remove the ansis dependency.

## 4.2.2

### Patch Changes

- 80e858f: fix how block editor styles get handled if useBlockAssets option is not set

## 4.2.2-next.1

### Patch Changes

- 80e858f: fix how block editor styles get handled if useBlockAssets option is not set

## 4.2.1

### Patch Changes

- 8bbd562: fix regression in block file names in dist folder if useBlockAssets option is not set

## 4.2.1-next.0

### Patch Changes

- 8bbd562: fix regression in block file names in dist folder if useBlockAssets option is not set

## 4.2.0

### Minor Changes

- 2e67b06: Replaces `squoosh` with a custom implementation using `sharp` for optimizing images.
- d60ce6c: Refine the way block assets get handled. 10up-toolkit will now create Webpack entrypoints for any assets that are defined in any block.json files automatically for you. So no need to manually adding manual entrypoints per block.

### Patch Changes

- bc89638: Fix how webpack handles addition of new block.json files during watch mode

## 4.2.0-next.2

### Minor Changes

- 2e67b06: Replaces `squoosh` with a custom implementation using `sharp` for optimizing images.

## 4.2.0-next.1

### Patch Changes

- bc89638: Fix how webpack handles addition of new block.json files during watch mode

## 4.2.0-next.0

### Minor Changes

- d60ce6c: Refine the way block assets get handled. 10up-toolkit will now create Webpack entrypoints for any assets that are defined in any block.json files automatically for you. So no need to manually adding manual entrypoints per block.

## 4.1.2

### Patch Changes

- 64134a9: Adding unmissable notice (error) when using HMR and SCRIPT_DEBUG is not set to true

  The recommended way of including the `fast-refresh.php` file is now the following:

  ```php
  $is_local_env = in_array( wp_get_environment_type(), [ 'local', 'development' ], true );
  $is_local_url = strpos( home_url(), '.test' ) || strpos( home_url(), '.local' );
  $is_local     = $is_local_env || $is_local_url;

  if ( $is_local && file_exists( __DIR__ . '/dist/fast-refresh.php' ) ) {
  	require_once __DIR__ . '/dist/fast-refresh.php';
  	TenUpToolkit\set_dist_url_path( basename( __DIR__ ), TENUP_THEME_DIST_URL, TENUP_THEME_DIST_PATH );
  }
  ```

- 86d68ac: Update `devServer` so the overlay only shows up on errors.
  Update `StyleLintPlugin` so it sets `failOnError` to `false`, similarly to `EslintPlugin`.

## 4.1.1

### Patch Changes

- da9c394: Treat js files inside `block` or `blocks` directories as blocks. [#204](https://github.com/10up/10up-toolkit/pull/204)

## 4.1.0

### Minor Changes

- c206d75: Remove grid autoprefixer. See https://github.com/10up/10up-toolkit/pull/197
- f33afc6: Fix react-refresh-runtime entrypoint

### Patch Changes

- @10up/babel-preset-default@2.0.3
- @10up/eslint-config@2.4.6
- @10up/stylelint-config@2.0.1

## 4.1.0-next.2

### Minor Changes

- c206d75: Remove grid autoprefixer. See https://github.com/10up/10up-toolkit/pull/197
- f33afc6: Fix react-refresh-runtime entrypoint

All notable changes to this project will be documented in this file, per [the Keep a Changelog standard](http://keepachangelog.com/).

## 4.0.0

- Changed: 10up-toolkit no longer transpiles `@10up/block-components`. Make sure to use the latest version of `@10up/block-components` that already ships transpiled code. [#181](https://github.com/10up/10up-toolkit/pull/181)
- Changed [BREAKING CHANGE]: Stop injecting `wp-polyfill` as dependecy of scripts built by 10up-toolkit. [#193](https://github.com/10up/10up-toolkit/pull/193).
- Updated: Dependencies [#182](https://github.com/10up/10up-toolkit/pull/182)
- Changed [BREAKING CHANGE]: Stylelint and eslint are now peerDependencies. This is a breaking change only for those not using npm >= 7. [#179](https://github.com/10up/10up-toolkit/pull/179)

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
- Added `.ico` and `.otf` files to be copied via copy-webpack-plugin.
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
