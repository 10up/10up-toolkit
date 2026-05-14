# Migrating to 10up-toolkit v7 (rspack)

10up-toolkit v7 replaces webpack with [rspack](https://rspack.dev/) as the underlying bundler. Rspack is a Rust-based bundler that is largely webpack-compatible but dramatically faster — expect 5-10x faster production builds and near-instant HMR in development.

This is a **breaking change**. Follow the steps below to upgrade your project.

---

## Quick checklist

1. Update `10up-toolkit` to v7 in your `package.json`
2. Rename `webpack.config.js` → `rspack.config.js` (if you have a custom config)
3. Update any webpack-specific plugin imports to rspack equivalents
4. Remove `@wordpress/dependency-extraction-webpack-plugin` from your project deps (it's now built in)
5. Run `npm install` and test your build

---

## What changed

### Bundler core

| Before (v6) | After (v7) |
|---|---|
| `webpack` | `@rspack/core` |
| `webpack-dev-server` | `@rspack/dev-server` |
| `webpack-cli` | Not needed — rspack is invoked via Node API |

### Plugins replaced by rspack built-ins

These webpack plugins have been replaced by rspack's built-in equivalents. If you referenced them in a custom config, update the imports:

| webpack plugin | rspack equivalent |
|---|---|
| `mini-css-extract-plugin` | `rspack.CssExtractRspackPlugin` |
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
| `@vanilla-extract/webpack-plugin` | No rspack support yet. If you use Vanilla Extract, you'll need to wait for upstream support or use an alternative CSS-in-JS solution. |
| `eslint-webpack-plugin` | Linting is decoupled from the build. Run `npx eslint .` separately or add it to your `package.json` scripts. |
| `stylelint-webpack-plugin` | Same as above — run `npx stylelint "**/*.css"` separately. |

### Loaders

### JavaScript transpilation

`babel-loader` and `@10up/babel-preset-default` have been replaced with rspack's built-in SWC loader (`builtin:swc-loader`). SWC is a Rust-based transpiler that is 20-70x faster than Babel.

The SWC configuration replicates everything `@10up/babel-preset-default` did: TypeScript/TSX support, automatic JSX runtime (or classic WordPress pragma mode), core-js polyfill injection, and browser targeting.

If your project has a custom `.babelrc` or `babel.config.js`, those files are no longer used by the bundler. You may still need them for Jest (which still uses `babel-jest`).

### CSS loaders

The following are still used as-is: `css-loader`, `sass-loader`, `postcss-loader`, `@svgr/webpack`, `url-loader`.

### Linaria and Vanilla Extract removed

Support for Linaria and Vanilla Extract CSS-in-JS solutions has been removed. CSS Modules remain fully supported.

---

## Migrating a custom webpack.config.js

If your project has a `webpack.config.js` at the root, v7 will still detect it and use it (with a deprecation warning). However, you should rename it to `rspack.config.js` and update imports.

### Before

```js
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  plugins: [
    new CopyPlugin({ patterns: [{ from: 'static' }] }),
    new MiniCssExtractPlugin(),
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
    new rspack.CssExtractRspackPlugin(),
    new rspack.DefinePlugin({ VERSION: JSON.stringify('1.0') }),
  ],
};
```

---

## WordPress dependency extraction

The toolkit now ships its own `RspackDependencyExtractionPlugin` that generates `.asset.php` files identical to the ones produced by `@wordpress/dependency-extraction-webpack-plugin`. It supports the same options:

- `injectPolyfill` (default: `false`)
- `outputFormat` (`'php'` or `'json'`, default: `'php'`)
- `useDefaults` (default: `true`)
- `combineAssets` (default: `false`)
- `requestToExternal` / `requestToExternalModule` / `requestToHandle` — custom mapping functions

The same default externalization rules apply: `@wordpress/*` packages are mapped to `wp.*` globals, `react` → `React`, `lodash` → `lodash`, etc.

If you were importing the WordPress plugin directly in a custom config:

```js
// Before
const DependencyExtractionPlugin = require('@wordpress/dependency-extraction-webpack-plugin');

// After
const DependencyExtractionPlugin = require('10up-toolkit/config/rspack/plugins/dependency-extraction');
```

---

## Linting changes

ESLint and Stylelint are no longer run as part of the build process. This was done for two reasons: the webpack-based lint plugins pulled in webpack as a dependency, and decoupling lint from the build makes both faster.

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

## package.json changes

Remove these from your project's `dependencies` or `devDependencies` if present (they're no longer needed):

- `webpack`
- `webpack-cli`
- `webpack-dev-server`
- `webpack-sources`
- `mini-css-extract-plugin`
- `copy-webpack-plugin`
- `html-webpack-plugin`
- `terser-webpack-plugin`
- `webpackbar`
- `@pmmmwh/react-refresh-webpack-plugin`
- `@wordpress/dependency-extraction-webpack-plugin`
- `@vanilla-extract/webpack-plugin`
- `@linaria/webpack5-loader`
- `@linaria/babel-preset`
- `@linaria/core`
- `@linaria/react`
- `babel-loader`
- `@10up/babel-preset-default`
- `eslint-webpack-plugin`
- `stylelint-webpack-plugin`

---

## Linaria and Vanilla Extract removed

Support for Linaria and Vanilla Extract has been removed in v7. These CSS-in-JS solutions were too prescriptive for a general-purpose toolkit. If your project uses either, you'll need to configure them independently outside of 10up-toolkit. CSS Modules remain fully supported out of the box.

---

## Testing: Jest → Rstest

Jest has been replaced with [Rstest](https://rstest.rs/), a test runner from the rspack team that uses SWC for transpilation. This eliminates the need for `babel-jest`, `@10up/babel-preset-default`, and any Babel configuration for tests.

### What changed

| Before (v6) | After (v7) |
|---|---|
| `jest` | `@rstest/core` (CLI: `rstest`) |
| `babel-jest` | Not needed — Rstest uses SWC natively |
| `@10up/babel-preset-default` | Not needed for tests |
| `jest.config.js` | `rstest.config.mjs` |
| `jest-unit.config.js` | `rstest-unit.config.mjs` |

### Updating test files

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

`describe`, `it`, `test`, `expect`, `beforeEach`, `afterEach` etc. all work the same — they're available globally with `globals: true` in the rstest config.

### Updating package.json scripts

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

### Snapshot format change

Rstest uses `>` as the key separator in snapshots instead of Jest's `:`. On first run, use `rstest -u` to regenerate snapshots.

### Packages to remove

- `jest`
- `babel-jest`
- `@10up/babel-preset-default` (unless needed elsewhere)
- Any `jest.config.js` or `babel.config.js` files used solely for Jest

See the [Rstest Jest migration guide](https://rstest.rs/guide/migration/jest) for the full reference.

---

## Troubleshooting

### Build fails with "Cannot find module 'webpack'"

You likely have a plugin or custom config that still imports webpack directly. Check your `rspack.config.js` and any custom plugins for `require('webpack')` and replace with `require('@rspack/core')`.

### `.asset.php` files not generated

Make sure `wpDependencyExternals` is not set to `false` in your `10up-toolkit` config in `package.json`. The built-in dependency extraction plugin is enabled by default for non-package builds.

### Hot reload not working

The React refresh plugin changed from `@pmmmwh/react-refresh-webpack-plugin` to `@rspack/plugin-react-refresh`. If you're referencing the old plugin anywhere, update the import. The `--hot` CLI flag works the same as before.

### Custom loader not working

Most webpack 5 loaders work with rspack out of the box. If you encounter issues, check the [rspack loader compatibility list](https://rspack.dev/guide/compatibility/webpack#loader). Rspack also provides several built-in loaders (like `builtin:swc-loader`) that can replace common webpack loaders.
