# Changelog

## 7.0.0-next.1

### Patch Changes

- 5e11087: Security: land the `sharp` bump and reconcile the dependabot manifest with its lockfile

  Bumps `sharp` from `0.32.6` to `0.35.3`, resolving the inherited libvips advisories that
  the previous security sweep had to defer, plus `webpack-dev-server` to `^5.2.6` and the
  patched transitives `@babel/core@^7.29.6`, `qs@6.15.3`, `brace-expansion@2.1.4`,
  `esbuild@0.28.2`, `form-data@4.0.6`, `immutable@5.1.9`, `tmp@0.2.7`, `ws@7.5.13`,
  `websocket-driver@0.7.5` and `body-parser@1.20.6`. `npm audit` goes from 2 critical to 0.

  **AVIF minification fix.** sharp reports `.avif` input as format `heif`, and from 0.35 the
  heif encoder requires an explicit compression. `config.heif` in `optimization.js` is now
  `{ ...config.avif, compression: 'av1' }`; without it, `heif()` throws
  `Expected one of: av1, hevc for compression but received undefined` and every `.avif`
  asset fails minification. Projects that run `.avif` files through the build are the ones
  affected — no config change is needed on their side.

  **Why the earlier `sharp` backout no longer applies.** That revert was correct at the time:
  from 0.33 onward sharp ships its prebuilt binaries as per-platform optional dependencies
  (`@img/sharp-linux-x64`, `@img/sharp-win32-x64`, …), and the lockfile generated then
  recorded only the host (darwin-arm64) entries, breaking `npm ci` on Linux and Windows with
  _"Could not load the `sharp` module using the linux-x64 runtime"_. npm now records every
  platform's entries regardless of the resolving host — this lockfile carries all 26
  `@img/sharp-*` entries (darwin, linux, linuxmusl, win32, freebsd, wasm), and a from-scratch
  re-resolve on macOS reproduces all 26 rather than pruning to darwin. Verified in a real
  `linux/amd64` container that `npm ci` succeeds and `require('sharp')` loads the linux-x64
  binary and encodes AVIF on both Node 20 (npm 10.8.2) and Node 24 (npm 11.17).

  Worth a glance after any future lockfile regeneration: the `@img/sharp-*` entry count
  should stay at 26.

## 7.0.0-next.0

### Major Changes

- e40dc56: Support and default to Node 24

  Node 24 (current Active LTS) is now the version the toolkit is developed, tested and released against, and the minimum supported Node version is now 20. Node 16 and 18 are past end-of-life and have been dropped from the test matrix; CI now covers Node 20, 22 and 24.

  This is a breaking change only in the sense that `engines` no longer permits Node 16/18. No build, config or API behaviour has changed — see `UPGRADING.md` for details.

### Minor Changes

- b08fb3b: Add WordPress Block Metadata Collections API support

  Integrate automatic generation of block metadata manifest files to improve block registration performance in WordPress 6.7+. When enabled, toolkit generates a PHP file (`blocks-manifest.php`) containing all block metadata from a single source, eliminating the need to read multiple `block.json` files at runtime.

  **New Features:**
  - Add `useBlockManifest` configuration option (boolean, default: `false`)
  - Add `--block-manifest` CLI flag for one-time manifest generation
  - Add `BuildBlocksManifestPlugin` webpack plugin that hooks into build completion
  - Automatic manifest regeneration in watch mode when blocks change

  **Configuration:**

  Enable via package.json:

  ```json
  {
    "10up-toolkit": {
      "useBlockAssets": true,
      "useBlockManifest": true
    }
  }
  ```

  Or via CLI flag:

  ```bash
  10up-toolkit build --block-manifest
  10up-toolkit start --block-manifest
  10up-toolkit watch --block-manifest
  ```

  **WordPress Integration:**

  Register the collection and automatically register all blocks:

  ```php
  $blocks_dir = get_template_directory() . '/dist/blocks';
  $manifest_path = get_template_directory() . '/dist/blocks-manifest.php';

  wp_register_block_metadata_collection( $blocks_dir, $manifest_path );

  // Automatically register all blocks from the manifest
  $manifest = require $manifest_path;
  foreach ( array_keys( $manifest ) as $block_dir ) {
      register_block_type_from_metadata( $blocks_dir . '/' . $block_dir );
  }
  ```

  **Benefits:**
  - Improved performance for projects with many blocks (50+)
  - Reduced filesystem I/O operations
  - Better opcode caching for block metadata
  - Preserves transformed asset paths from the build process (TS→JS, SCSS→CSS)

  The manifest is generated in `dist/blocks-manifest.php` and works seamlessly with the existing `useBlockAssets` workflow.

- dda2bbd: Security: Fix critical and high severity CVEs in transitive dependencies

  Minimum Node.js version is now 20.9. The major dependency bumps required
  for the security fixes (copy-webpack-plugin@^14, image-minimizer-webpack-plugin@^5)
  require Node ≥20.9. Node 16 and 18 are EOL and no longer supported.
  - Bump `copy-webpack-plugin` from ^11 to ^14 — resolves serialize-javascript RCE (GHSA-5c6j-r48x-rmvq) and CPU exhaustion (GHSA-qj8w-gfj5-8c6v)
  - Bump `image-minimizer-webpack-plugin` from ^3 to ^5 — same serialize-javascript fix
  - Downgrade `@linaria/*` from ^5 to ^4.5.4 in 10up-theme — removes happy-dom@10 CVE-2024-53382
  - Bump `webpackbar` from ^6 to ^7 — webpack 5.96+ added stricter ProgressPlugin schema validation that webpackbar 6 fails by passing non-schema options to its `ProgressPlugin` parent; webpackbar 7 routes those options to a separate instance and is forward-compatible. Avoids needing to pin webpack downstream.
  - Switch the toolkit's linaria integration from the meta-package `@linaria/webpack-loader` to `@linaria/webpack5-loader` directly. The meta-package always installs **both** the webpack 4 and webpack 5 loaders, dragging webpack@4.47.0 (and a long tail of vulnerable transitive deps — `serialize-javascript@<7.0.5`, `braces@2`, `micromatch@3`, `terser-webpack-plugin@1`, etc.) into every install even though only webpack 5 is used. Importing the webpack5 loader directly drops the webpack 4 chain entirely, fixing those CVEs at the dep-tree level instead of via root-level `overrides` (which don't propagate to consumers of the published `10up-toolkit`).

    **Migration for `10up-toolkit` consumers using linaria:** replace `"@linaria/webpack-loader"` with `"@linaria/webpack5-loader"` in your project's `package.json` and update any `loader: '@linaria/webpack-loader'` references in custom webpack configs. No API changes — the webpack5 loader is the same module the meta-package was delegating to.

  - Bump `engines.node` to `>=20.9.0` across the toolkit, eslint-config, stylelint-config, and 10up-theme workspaces. Update CI matrix to test on Node 20 + 22 only.

  Reduces critical/high vulnerabilities to 0. The serialize-javascript / braces / micromatch fixes propagate to consumers via the linaria webpack5-loader swap. Remaining low/moderate issues are in dev tooling (`@wordpress/env`, `jest-environment-jsdom`, etc.) with no upstream fixes available yet.

  ### Note on remaining monorepo-only `overrides`

  The root `package.json` keeps three `overrides` as documented temporary workarounds. npm only honors `overrides` declared in the top-level project, so these apply only to this monorepo's `npm install` / `npm ci` — they do **not** flow through to consumers installing `10up-toolkit` as a dependency. None of the three are blocking consumer security:
  - `minimatch: ^9.0.7` — patches a ReDoS in `@typescript-eslint@^6`'s pinned minimatch. Resolved permanently by upgrading `@typescript-eslint` to v8 (deferred — major bump on `@10up/eslint-config` with consumer impact).
  - `stylelint-declaration-strict-value: ~1.10.11` — keeps the plugin on the stylelint 15 line. The 1.11.x line bumped its peer to stylelint ≥16, conflicting with `@10up/stylelint-config`'s stylelint 15 peer. Resolved by upgrading the stylelint config to v16 (deferred — major bump with consumer impact).
  - `@types/node: ^20.19.0` — workaround for `@manypkg/find-root@1`'s legacy `@types/node@^12.7.1` declaration, which conflicts with `@inquirer/external-editor`'s `@types/node>=18` peer. Upstream blocker: `@changesets/cli@2.x` still ships with `@manypkg/find-root@1`; only the `@changesets/cli@3.0.0-next.2` pre-release has migrated.

  ### Follow-up security bumps (added when restacking onto Node 24 support)

  New advisories landed against the original set of fixes. Additionally addressed:
  - Bump `postcss` from `^8.4.31` to `^8.5.26` — resolves path traversal in previous-source-map auto-loading via `sourceMappingURL` (GHSA-6g55-p6wh-862q and its incomplete-fix follow-up).
  - Bump `svgo` from `^3.2.0` to `^4.0.2` — resolves the `removeScripts` advisory, where the plugin left some executable scripts intact. This is directly relevant since this is the code path that sanitises project SVGs.

    **Migration for consumers with a custom `svgo.config.js`:** svgo 4 removed `removeViewBox` from `preset-default`, and changed parts of the plugin config format. The toolkit's own default config was updated accordingly (viewBox is preserved by default in svgo 4, so the previous `overrides: { removeViewBox: false }` is both unnecessary and no longer valid). Custom svgo configs written for svgo 3 may need updating — see the [svgo 4 release notes](https://github.com/svg/svgo/releases).

  - Bump `@wordpress/env` in `projects/10up-theme` from `^10.10.0` to `^11.13.0` — dev-only, resolves an `extract-zip` symlink path traversal.

  ### Known remaining advisories

  `npm audit` still reports issues that are **not** fixable within this PR:
  - **`sharp` (high) — inherited libvips CVEs.** `sharp@^0.35.3` fixes these and its `engines.node >=20.9.0` matches this branch's floor exactly, but it cannot land here yet. From 0.33 onward sharp ships its prebuilt binaries as per-platform optional dependencies (`@img/sharp-linux-x64`, `@img/sharp-win32-x64`, …), and npm only records the _host_ platform's entries in the lockfile — `--os`/`--cpu` are ignored, even on a from-scratch resolution. A lockfile generated on macOS therefore breaks `npm ci` on Linux and Windows with _"Could not load the `sharp` module using the linux-x64 runtime"_. Landing it needs the lockfile regenerated on Linux (or in CI). Two things to carry over when that happens: sharp reports `.avif` input as format `heif`, and 0.35 requires an explicit compression, so `config.heif` must become `{ ...config.avif, compression: 'av1' }` (verified byte-identical to the old `avif()` output); a `NOTE` to that effect is left in `optimization.js`.
  - **`webpack-dev-server` (2 critical, several high/moderate — `shell-quote`, `websocket-driver`, `ws`, `http-proxy-middleware`, `sockjs`, `launch-editor`).** Every one of these comes through `webpack-dev-server`, and the whole 5.x line is affected — the only fix is `webpack-dev-server@6`, a major upgrade with dev-server config changes that deserves its own PR and HMR testing. These affect the local dev server only, not built output.
  - **`@wordpress/env` → `@wp-playground/*` → `adm-zip`, `tmp` (dev-only).** `@wordpress/env@11.13.0` is the latest release and still pulls `adm-zip@0.5.x`; needs an upstream fix.
  - **`postcss@8.5.14` still present in this monorepo's tree**, hoisted via `stylelint@15` / `cssnano` transitives. Consumers of the published `10up-toolkit` are not affected, because the toolkit declares `postcss@^8.5.26` and npm resolves a single satisfying copy for `postcss-loader`. Clearing it here depends on the deferred `stylelint@16` upgrade.
  - **`immutable` (via `sass`), `js-yaml` / `brace-expansion` (via the `eslint@8` chain), `form-data` / `ws` (via `jsdom` in tests).** All build/test-time only, awaiting upstream releases.

### Patch Changes

- 1fe01b6: Fix: Update "Dependency Extraction Webpack Plugin" Dependency
- d22ef93: Fix block entrypoint tests failing on Windows

  The `entry` tests mocked `process.cwd()` with a POSIX path while the module under test derives the blocks directory with `path.resolve`, which is platform-native. On Windows the two never lined up, so the blocks directory prefix was never stripped and every entry name came out as a full absolute path, failing 9 tests on the `windows-latest` CI job.

  Fixtures are now anchored to the same `path.resolve` call as the code under test, so they describe a filesystem that is self-consistent on every platform. Windows path handling additionally gets its own suite that swaps `path` for `path.win32`, so the behaviour is covered on Linux and macOS runs too instead of only when CI happens to run on Windows.

  Test-only change; no runtime behaviour was modified.

- 6cb07e6: Fix: leading slashes in asset generation
- Updated dependencies [2535d76]
- Updated dependencies [e40dc56]
  - @10up/stylelint-config@4.0.0-next.0
  - @10up/babel-preset-default@3.0.0-next.0
  - @10up/eslint-config@5.0.0-next.0

## 6.5.1

### Patch Changes

- 6a4b3d2: Update webpack-dev-server to 5.2.2 and react-refresh-webpack-plugin to 0.5.17

## 6.5.0

### Minor Changes

- 4d7bc0d: Added callback to webpack server.close

### Patch Changes

- 0a962bc: Pin eslint-plugin-jest to v28 to fix conflict with the `@typescript/eslint-plugin` dep.

## 6.5.0-next.1

### Minor Changes

- 4d7bc0d: Added callback to webpack server.close

### Patch Changes

- Updated dependencies [be6517d]
  - @10up/eslint-config@4.1.3-next.0

## 6.4.2-next.0

### Patch Changes

- 0a962bc: Pin eslint-plugin-jest to v28 to fix conflict with the `@typescript/eslint-plugin` dep.

## 6.4.1

### Patch Changes

- 04fa289: Fix wrong peer deps in some packages and make sure all packages supports v22
- 394b2db: Fix: Allow Block Specific stylesheets to be scss/sass files
- d005002: Fix include `viewStyle` assets in dynamic version generation
- dc8805c: Fix add new block theme related strings to project init replacements

## 6.4.0

### Minor Changes

- 402c108: Introducing Vanilla-extract support

### Patch Changes

- 6573d42: Fix: transform file extension for .sass and .scss assets inside block.json files

## 6.3.1-next.1

### Minor Changes

- 402c108: Introducing Vanilla-extract support

### Patch Changes

- Updated dependencies [402c108]
  - @10up/eslint-config@4.1.1-next.0

## 6.3.0

### Minor Changes

- 3a5b540: Allow block-specific CSS entry points to get automatically generated for any CSS files in the `assets/css/blocks` directory.

### Patch Changes

- 8b74e5a: Simple enhancements to toolkit project command to align with devops needs.
- 7ce09d9: Fix: transform file extension for .ts and .tsx assets inside block.json files

## 6.3.0-next.0

### Minor Changes

- 3a5b540: Allow block-specific CSS entry points to get automatically generated for any CSS files in the `assets/css/blocks` directory.

### Patch Changes

- 8b74e5a: Simple enhancements to toolkit project command to align with devops needs.
- 7ce09d9: Fix: transform file extension for .ts and .tsx assets inside block.json files

## 6.2.2

### Patch Changes

- 7692784: Simple enhancements to toolkit project command to align with devops needs.

## 6.2.1

### Patch Changes

- 868ffdc: Fixing git clone path inside project command to support paths with spaces.

## 6.2.0

### Minor Changes

- dba1534: Project Command (BETA)

### Patch Changes

- dcc09bb: Fix: watch close when using modules
- 1aba76c: Fix project init command
- 58d5861: Fix init command
- d9f3642: Refactor init command
- 1f612a2: Update `project` command to use latest

## 6.2.0-next.4

### Patch Changes

- dcc09bb: Fix: watch close when using modules
- 1f612a2: Update `project` command to use latest

## 6.2.0-next.3

### Patch Changes

- d9f3642: Refactor init command

## 6.2.0-next.2

### Patch Changes

- 58d5861: Fix init command

## 6.2.0-next.1

### Patch Changes

- 1aba76c: Fix project init command

## 6.2.0-next.0

### Minor Changes

- dba1534: Project Command (BETA)

### Patch Changes

- Updated dependencies [5ddee2c]
  - @10up/eslint-config@4.1.0-next.0

## 6.1.0

### Minor Changes

- a41a046: Add support for `scriptModule` & `viewScriptModule` assets
- 1693913: Bundle PostCSS Global Data Plugin with default configuration

### Patch Changes

- 20d2e65: Feature: allow defining module script entrypoints via `moduleEntry` key in `package.json` decoupled from blocks

## 6.1.0-next.1

### Minor Changes

- 1693913: Bundle PostCSS Global Data Plugin with default configuration

### Patch Changes

- 20d2e65: Feature: allow defining module script entrypoints via `moduleEntry` key in `package.json` decoupled from blocks

## 6.1.0-next.0

### Minor Changes

- a41a046: Add support for `scriptModule` & `viewScriptModule` assets

## 6.0.1

### Patch Changes

- 73a9d57: Fix peer deps

## 6.0.0

### Major Changes

- 71460c9: update default value of `useBlockAssets` to true. If you are not ready for it yet. Set `useBlockAssets` to false in your 10up-toolkit `package.json` config.

  ```json
  {
    "name": "your-project",
    "10up-toolkit": {
      "useBlockAssets": false
    }
  }
  ```

- 091bb26: Update postcss-preset-env to ^9.0.0 from ^7.0.0
  Swap postcss-editor-styles with postcss-editor-styles-wrapper which is compatible with PostCSS 8
- e6c5140: Update linaria to next major and fix an issue with react-refresh plugin. Also drops support for node 14.

### Minor Changes

- e29ee64: Feature: sourcemap option for production builds
- 0c969ef: Add support to configure Webpack's publicPath

### Patch Changes

- 08f7c78: Add `.local` to the default list of supported domains.
- 6c8dbb5: Update dependencies
- 91f266f: Fix HRM (again)
- 5a8f979: Stop using react fast refresh fork in favor of the upstream package
- 01ade56: Fix: allow overriding buildfiles.config.js, filenames.config.js and paths.config.js as stated in README

## 6.0.0-next.0

### Major Changes

- 71460c9: update default value of `useBlockAssets` to true. If you are not ready for it yet. Set `useBlockAssets` to false in your 10up-toolkit `package.json` config.

  ```json
  {
    "name": "your-project",
    "10up-toolkit": {
      "useBlockAssets": false
    }
  }
  ```

- 091bb26: Update postcss-preset-env to ^9.0.0 from ^7.0.0
  Swap postcss-editor-styles with postcss-editor-styles-wrapper which is compatible with PostCSS 8
- e6c5140: Update linaria to next major and fix an issue with react-refresh plugin. Also drops support for node 14.

### Minor Changes

- e29ee64: Feature: sourcemap option for production builds
- 0c969ef: Add support to configure Webpack's publicPath

### Patch Changes

- 08f7c78: Add `.local` to the default list of supported domains.
- 6c8dbb5: Update dependencies
- 91f266f: Fix HRM (again)
- 5a8f979: Stop using react fast refresh fork in favor of the upstream package
- 01ade56: Fix: allow overriding buildfiles.config.js, filenames.config.js and paths.config.js as stated in README
- Updated dependencies [91f266f]
- Updated dependencies [ea9ca67]
- Updated dependencies [47c19c9]
- Updated dependencies [3fce625]
  - @10up/babel-preset-default@2.1.1-next.0
  - @10up/stylelint-config@3.0.0-next.0
  - @10up/eslint-config@4.0.0-next.0

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
- Changed [BREAKING CHANGE]: Stop injecting `wp-polyfill` as dependency of scripts built by 10up-toolkit. [#193](https://github.com/10up/10up-toolkit/pull/193).
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
- Changed - Dropped `imagemin` in favor of `squoosh` [#157](https://github.com/10up/10up-toolkit/pull/157)
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
- Fixed: Typo in HtmlWebpackPlugin where it was looking for the template in public folder instead of folder. Additionally, it now only defines a custom template if it is defined in the project.

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
