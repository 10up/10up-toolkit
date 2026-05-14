# Migrating to 10up-toolkit v7

10up-toolkit v7 is a ground-up modernization of the build and test toolchain. Webpack has been replaced with [rspack](https://rspack.dev/), Jest with [Rstest](https://rstest.rs/), and Babel with [SWC](https://swc.rs/). The result is dramatically faster builds, near-instant HMR, and fewer dependencies.

This is a **breaking change**. Follow the steps below to upgrade your project.

---

## Quick checklist

1. Update `10up-toolkit` to v7 in your `package.json`
2. Rename `webpack.config.js` → `rspack.config.js` (if you have a custom config)
3. Update any webpack-specific plugin imports to rspack equivalents
4. Replace `jest.*` calls with `rstest.*` in test files
5. Remove stale dependencies (see list below)
6. Run `npm install` and test your build

---

## What changed

### Bundler

| Before (v6) | After (v7) |
|---|---|
| `webpack` | `@rspack/core` |
| `webpack-dev-server` | `@rspack/dev-server` |
| `webpack-cli` | Not needed — rspack is invoked via Node API |

### JavaScript transpilation

| Before (v6) | After (v7) |
|---|---|
| `babel-loader` | `builtin:swc-loader` (rspack built-in) |
| `@10up/babel-preset-default` | SWC config built into toolkit |

SWC replicates everything the Babel preset did: TypeScript/TSX support, automatic JSX runtime (or classic WordPress pragma mode), core-js polyfill injection, and browser targeting — but 20-70x faster.

If your project has a custom `.babelrc` or `babel.config.js`, those files are no longer used by the bundler.

### CSS handling

| Before (v6) | After (v7) |
|---|---|
| `css-loader` | Rspack native CSS (`type: 'css'`) |
| `mini-css-extract-plugin` | Rspack native CSS extraction |
| `url-loader` | Rspack native `asset/inline` module |

CSS, SCSS, and CSS Modules are handled natively by rspack. The `postcss-loader` and `sass-loader` remain in the pipeline for PostCSS and Sass processing.

### Plugins replaced by rspack built-ins

| webpack plugin | rspack equivalent |
|---|---|
| `copy-webpack-plugin` | `rspack.CopyRspackPlugin` |
| `html-webpack-plugin` | `rspack.HtmlRspackPlugin` |
| `terser-webpack-plugin` | `rspack.SwcJsMinimizerRspackPlugin` |
| `webpackbar` | `rspack.ProgressPlugin` |

### Plugins replaced by rspack packages

| webpack plugin | rspack replacement |
|---|---|
| `@pmmmwh/react-refresh-webpack-plugin` | `@rspack/plugin-react-refresh` |
| `@wordpress/dependency-extraction-webpack-plugin` | Built-in `RspackDependencyExtractionPlugin` (ships with toolkit) |

### Plugins removed

| Plugin | Reason |
|---|---|
| `eslint-webpack-plugin` | Linting is decoupled from the build. Run `npx eslint .` separately. |
| `stylelint-webpack-plugin` | Same — run `npx stylelint "**/*.css"` separately. |

### Testing

| Before (v6) | After (v7) |
|---|---|
| `jest` | `@rstest/core` (CLI: `rstest`) |
| `babel-jest` | Not needed — Rstest uses SWC natively |
| `jest.config.js` | `rstest.config.mjs` |

### CSS-in-JS removed

Support for Linaria and Vanilla Extract has been removed. These were too prescriptive for a general-purpose toolkit. CSS Modules remain fully supported out of the box.

---

## Migrating a custom webpack.config.js

If your project has a `webpack.config.js` at the root, v7 will detect it and use it (with a deprecation warning). Rename it to `rspack.config.js` and update imports:

### Before

```js
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  plugins: [
    new CopyPlugin({ patterns: [{ from: 'static' }] }),
    new webpack.DefinePlugin({ VERSION: JSON.stringify('1.0') }),
  ],
};
```

### After

```js
const rspack = require('@rspack/core');

module.exports = {
  plugins: [
    new rspack.CopyRspackPlugin({ patterns: [{ from: 'static' }] }),
    new rspack.DefinePlugin({ VERSION: JSON.stringify('1.0') }),
  ],
};
```

Note: CSS extraction and `mini-css-extract-plugin` are no longer needed in custom configs — rspack handles CSS natively.

---

## WordPress dependency extraction

The toolkit ships its own `RspackDependencyExtractionPlugin` that generates `.asset.php` files identical to the ones produced by `@wordpress/dependency-extraction-webpack-plugin`. It supports the same options:

- `injectPolyfill` (default: `false`)
- `outputFormat` (`'php'` or `'json'`, default: `'php'`)
- `useDefaults` (default: `true`)
- `combineAssets` (default: `false`)
- `requestToExternal` / `requestToExternalModule` / `requestToHandle` — custom mapping functions

If you were importing the WordPress plugin directly in a custom config:

```js
// Before
const DependencyExtractionPlugin = require('@wordpress/dependency-extraction-webpack-plugin');

// After
const DependencyExtractionPlugin = require('10up-toolkit/config/rspack/plugins/dependency-extraction');
```

---

## Linting changes

ESLint and Stylelint are no longer run as part of the build process. Decoupling lint from the build makes both faster.

Add lint scripts to your `package.json`:

```json
{
  "scripts": {
    "lint:js": "eslint .",
    "lint:css": "stylelint '**/*.{css,scss}'",
    "lint": "npm run lint:js && npm run lint:css"
  }
}
```

---

## Migrating tests from Jest to Rstest

Rstest is Jest-compatible. The main change is replacing `jest.*` calls with `rstest.*`:

```js
// Before
jest.mock('./module');
jest.fn();
jest.spyOn(obj, 'method');
jest.requireActual('./module');

// After
rstest.mock('./module');
rstest.fn();
rstest.spyOn(obj, 'method');
rstest.requireActual('./module');
```

`describe`, `it`, `test`, `expect`, `beforeEach`, `afterEach` etc. all work the same with `globals: true` in the rstest config.

Update your package.json scripts:

```json
{
  "scripts": {
-   "test": "jest",
-   "test:watch": "jest --watch"
+   "test": "rstest",
+   "test:watch": "rstest --watch"
  }
}
```

Rstest uses `>` as the snapshot key separator instead of Jest's `:`. Run `rstest -u` to regenerate snapshots on first run.

See the [Rstest Jest migration guide](https://rstest.rs/guide/migration/jest) for the full reference.

---

## Packages to remove

Remove these from your project's `dependencies` or `devDependencies` if present:

**Bundler:**
- `webpack`, `webpack-cli`, `webpack-dev-server`, `webpack-sources`
- `mini-css-extract-plugin`, `copy-webpack-plugin`, `html-webpack-plugin`
- `terser-webpack-plugin`, `webpackbar`
- `css-loader`, `url-loader`
- `@pmmmwh/react-refresh-webpack-plugin`
- `@wordpress/dependency-extraction-webpack-plugin`
- `eslint-webpack-plugin`, `stylelint-webpack-plugin`

**Transpilation:**
- `babel-loader`, `@10up/babel-preset-default`

**CSS-in-JS:**
- `@vanilla-extract/webpack-plugin`
- `@linaria/webpack5-loader`, `@linaria/babel-preset`, `@linaria/core`, `@linaria/react`

**Testing:**
- `jest`, `babel-jest`

**Misc (no longer used):**
- `error-stack-parser`, `core-js-pure`

---

## Troubleshooting

### Build fails with "Cannot find module 'webpack'"

You likely have a plugin or custom config that still imports webpack directly. Check your `rspack.config.js` and any custom plugins for `require('webpack')` and replace with `require('@rspack/core')`.

### `.asset.php` files not generated

Make sure `wpDependencyExternals` is not set to `false` in your `10up-toolkit` config in `package.json`. The built-in dependency extraction plugin is enabled by default for non-package builds.

### Hot reload not working

The React refresh plugin changed from `@pmmmwh/react-refresh-webpack-plugin` to `@rspack/plugin-react-refresh`. If you're referencing the old plugin anywhere, update the import. The `--hot` CLI flag works the same as before.

### CSS not being extracted

v7 uses rspack's native CSS handling. If you had custom `css-loader` or `mini-css-extract-plugin` config, remove it — rspack handles CSS extraction automatically via `type: 'css'` in module rules.

### SVG imports broken

`url-loader` has been replaced with rspack's native `asset/inline` module type. SVGs imported in JS still go through `@svgr/webpack` for React component usage. If you were relying on `url-loader` options, use rspack's [asset modules configuration](https://rspack.dev/guide/features/asset-module) instead.
