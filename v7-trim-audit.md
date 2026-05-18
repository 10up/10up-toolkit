# 10up-toolkit v7 Trim Audit

Companion to [`comparison-10up-toolkit-vs-wordpress-build.md`](./comparison-10up-toolkit-vs-wordpress-build.md).

v7.0 of toolkit is about becoming lean — ideally faster. Before swapping
engines (rspack, Biome, esbuild — see [#451][i451], [#478][i478]) or moving
to `@wordpress/scripts` (Option A in the comparison doc), the cheap win is
to delete code we no longer need. This audit catalogs what can go.

Confidence levels:

- ✅ **Confirmed removals** — signed off, ship as one PR
- 🟡 **Worth considering** — defensible but needs a decision
- 🔴 **Explicitly staying** — for the record, so we don't re-litigate

---

## ✅ Confirmed removals

All 17 ship as one PR / one major bump. Pure deletions with no
consumer-facing changes beyond "you no longer install a thing you
weren't using."

### 1. Vanilla Extract

- `package.json` — drop `@vanilla-extract/webpack-plugin` dep
- `config/webpack/plugins.js:12,55,101` — `VanillaExtractPlugin` import + conditional registration
- `config/webpack/modules.js:147` — `.vanilla.css$` CSS rule
- `__tests__/build-project-vanilla-extract/` — fixture + snapshots

### 2. Linaria

- `package.json:86-95` — `@linaria/babel-preset` + `@linaria/webpack-loader` peer deps & optional metadata
- `config/webpack/modules.js:56,57,94-106,128-139,198,201` — `LINARIA_EXTENSION` regex, conditional Babel preset, conditional webpack loader, exclude lists
- `__tests__/build-project-linaria/` — fixture + snapshots

### 3. BrowserSync

- `package.json` — no direct dep (already opt-in via user-installed packages)
- `config/webpack/plugins.js:16,57-87,186` — `BrowserSyncPlugin` integration + deprecation plugin
- `config/webpack/plugins/no-browser-sync.js` — deprecation-notice plugin
- `utils/config.js` — `devURL` config key (only exists to feed BrowserSync; kill it with BrowserSync)
- `config/webpack/devServer.js:4,21` — `devURL` reads
- Already tracked in [#327][i327].

### 4. Package mode

The single biggest cleanup. Removing this collapses ~40 conditional
branches across the webpack config.

- `utils/config.js:222-282` — `getTenUpScriptsPackageBuildConfig`
- `utils/config.js:196-219` — `removeScope`, `safeVariableName`, `normalizePackageType` helpers (only used by package mode)
- `utils/config.js:300-314` — `getModuleBuildFiles` (package-mode dual-config helper)
- `config/webpack.config.js:27-32,47,50,69-71,79-108,110` — `packageConfig`, `isPackage`, the entire `moduleConfig` branch, `experiments.outputModule`
- `config/webpack/entry.js:11,15-16,141-176` — `isPackage`, `packageConfig`, package-mode entry shape
- `config/webpack/output.js:3-22` — `isPackage` branch
- `config/webpack/externals.js:1-14` — `isPackage` branch (leaves only the `jquery`/`lodash` fallback; see 🟡 #9)
- `config/webpack/target.js:1-9` — `packageType`/`isModule` branches
- `config/webpack/modules.js:60,86,162,177,210-213` — `isPackage` branches and the package-only font/image asset rule
- `config/webpack/plugins.js:38,103-107,153,202-217` — `isPackage` branches in MiniCssExtract + CopyWebpackPlugin + DependencyExtractionWebpackPlugin
- `config/webpack/devServer.js:2,10-15` — `isPackage`, package-mode dev-server shape
- Already tracked in [#453][i453].

### 5. `init` command + the entire `project` command tree

- `scripts/project.js` (and `scripts/project/` directory):
  - `init.js`, `generate-ci.js`, `build.js`, `package.js`, `update-composer.js`, `index.js`
  - `bash/scripts.sh`, `bash/Dockerfile`
- `project/` (templates directory):
  - `default-variables.json`
  - `gitlab/deploy-configs/*.tmpl`
  - `local/scripts/build.sh`, `local/scripts/rsync-excludes.txt`
- `utils/project.js` — `getProjectRoot`, `getWordPressLatestVersion`, `getProjectVariables`, `replaceVariables`, `setEnvVariables`, `getGitBranch`, `getEnvironmentFromBranch`, `flattenObject` (all only used by `project` subcommands)
- Already broken: [#454][i454] (`project init` hangs indefinitely).

### 6. Built-in unit testing

- `scripts/test-unit-jest.js`, `scripts/test-unit-js.js`
- `config/jest-unit.config.js`, `config/jest/style.mock.js`
- `config/babel-transform.js` (only consumed by `jest-unit.config.js`)
- `test-utils/` directory (jest test helpers)
- `utils/config.js:64-99` — `hasJestConfig`, `getJestOverrideConfigFile`
- Already broken: [#480][i480] (`test-unit-jest` doesn't work out of the box).

### 7. `postcss-editor-styles-wrapper`

- `package.json` — drop `postcss-editor-styles-wrapper` dep
- `config/postcss.config.js:32-39` — the `editor-style.css` filename-based
  conditional that auto-wires this plugin

Users who still want editor-style scoping can add the plugin to a
project-level `postcss.config.js`. Removes magic-by-filename behavior
that's surprising when it doesn't fire.

### 8. `bin/10up-scripts.js` (the old alias)

`bin/10up-scripts.js:4` already says *"deprecated and will be removed soon!"*
v7 is the moment.

Also remove the `packageJson['@10up/scripts']` fallback at `utils/config.js:156`.

### 9. `scripts/check-engines.js`

- Shells out to `check-node-version` — which **is not in `package.json`
  dependencies**. Already broken.
- The floors it enforces (`node>=10`, `npm>=6.9`) are below what `engines`
  in `package.json` already declares (`node>=16`).
- npm enforces `engines` itself if `engine-strict=true`.

### 10. `ignore-emit-webpack-plugin` dependency

Listed in `package.json:46`. **`grep` finds zero usages in code.** Dead.

### 11. `url-loader`

Only used in `config/webpack/modules.js:144` (the SVG rule:
`['@svgr/webpack', 'url-loader']`). webpack 5's built-in `asset/inline` /
`asset/source` types cover this. `url-loader` has been unmaintained since
2021 (the project recommends `asset modules` directly).

### 12. `core-js-pure`

Both `core-js` (used by `@10up/babel-preset-default`) and `core-js-pure`
are declared as deps. `core-js-pure` is for **library authors who don't
want to pollute globals** — that's exclusively the package-mode use case.
With package mode gone, drop `core-js-pure`.

### 13. The `noop-loader` in `modules.js`

`config/webpack/plugins/noop-loader.js` is applied unconditionally to
every JS file at `modules.js:117`. The implementation is literally:

```js
module.exports = function (source, map) {
    this.cacheable();
    this.callback(null, source, map);
};
```

Looks like dead instrumentation from an old experiment.

### 14. `read-pkg` (separate from `read-pkg-up`)

`utils/package.js` uses both. `read-pkg-up` already returns the parsed
`package.json`. `read-pkg` is only used in `getPackageVersion` to read the
toolkit's *own* version — `require('../package.json').version` does the
same job synchronously with zero deps.

### 15. `--webpack-no-externals` flag / `TENUP_NO_EXTERNALS` env var

- `scripts/start.js:19-21` — CLI flag handling
- `utils/config.js:136-140` — env-var reading into `wpDependencyExternals`
- `config/webpack/plugins.js:202` — gate on `wpDependencyExternals`

Vestigial escape hatch. The `wpDependencyExternals` field can stay as a
default (`true`) inside the config object, but the CLI flag + env var
plumbing goes.

### 16. `image-minimizer-webpack-plugin` + `sharp` + `svgo` in-bundler

- `package.json` — drop `image-minimizer-webpack-plugin`, `sharp`, `svgo`
- `config/webpack/optimization.js:3-6,40-143` — both `ImageMinimizerPlugin`
  blocks (raster + SVG) and the `sharp`/`svgo` imports

`sharp` pulls a ~50MB native binary; on cold-cache CI runs this is the
dominant install cost. Image optimization moves to a standalone
`npm run optimize-images` step or an external tool like `sharp-cli` —
matches what `@wordpress/scripts` does.

### 17. `@svgr/webpack`

- `package.json` — drop `@svgr/webpack` dep
- `config/webpack/modules.js:142-145` — entire `.svg$` rule

Plenty of 10up projects don't use SVG-as-React-component. Projects that
do can install `@svgr/webpack` (or `vite-plugin-svgr`-style alternatives)
themselves.

**Deps that fall out from §1–17:**
`@vanilla-extract/webpack-plugin`, `inquirer`, `node-fetch`, `yaml`, `jest`,
`babel-jest`, `@wordpress/jest-console`, `eslint-plugin-jest`,
`postcss-editor-styles-wrapper`, `ignore-emit-webpack-plugin`, `url-loader`,
`core-js-pure`, `read-pkg`, `image-minimizer-webpack-plugin`, `sharp`,
`svgo`, `@svgr/webpack`.

---

## 🟡 Worth considering / needs a decision

### 18. `--block-modules` / `useScriptModules` dual-config path

The "build CommonJS *and* ESM in one webpack run" mode. Implemented across:

- `utils/config.js:112,144` — CLI flag → projectConfig
- `config/webpack.config.js:35,79-108,110` — entire `moduleConfig` branch + array-return
- `config/webpack/output.js:6,26` — `useScriptModules` in `clean`
- `config/webpack/modules.js`, `target.js`, `plugins.js`, `devServer.js` — `isModule` branches throughout

With WordPress's Script Modules API now mainstream (2024+), the cleaner
v7 shape is "build modules natively" rather than maintain a dual-config
split. Either:

- **Remove the legacy non-module path** (aggressive — needs migration guide), or
- **Remove the dual-config plumbing** and keep one mode at a time

The current "two configs at once" mode is a maintenance tax and has known
bugs ([#428][i428]).

### 19. `jquery`/`lodash` externals default + `lodash-es` alias

- `config/webpack/externals.js:17-18` — hardcoded window-global externals
- `config/webpack/resolve.js:5` — `lodash-es: 'lodash'` alias

**Pending verification:** confirm that
`@wordpress/dependency-extraction-webpack-plugin` covers `jquery` and
`lodash` for projects that import them. If yes, this entire pre-wiring
goes — including the `lodash-es` alias.

### 20. `chalk@4`

Used in `utils/cli.js` (process signal warnings), `scripts/project/*`
(removed in §5), and a few others. After §5, only the
`displayWebpackStats` helper and signal warnings would use it. Options:

- Drop entirely (use plain `console.log`)
- Replace with `picocolors` (~10× smaller, no deps)

### 21. `resolve-bin` + `cross-spawn` in the lint scripts

`scripts/lint-js.js`, `lint-style.js`, `format-js.js` all use
`cross-spawn` + `resolve-bin` to launch CLI tools as subprocesses.
ESLint v9 and Stylelint have programmatic APIs that work in-process.
Removing the spawn-shell dance simplifies error handling, removes
`resolve-bin` + `cross-spawn` deps, and ties in with [#420][i420]
(ESLint v9 migration).

---

## 🔴 Explicitly staying

For the record, so future readers don't re-litigate:

- **`loadBlockSpecificStyles`** — per-block CSS auto-enqueue is a
  meaningful DX feature.
- **TypeScript via parallel `tsc`** (`config/webpack/plugins/tsc.js`) —
  TypeScript is a first-class citizen in v7.
- **Fast Refresh dual-compile + `fast-refresh.php` shim** — the
  architecture has moving parts but is necessary for the current HMR
  model.
- **`paths.config.js` / `buildfiles.config.js` / `filenames.config.js`
  project-override mechanism** — flexibility some projects rely on (and
  the basis of [#187][i187], the `toolkit.config.js` proposal).

---

## Suggested rollout

The 17 ✅ items ship as **one PR / one major bump**. Pure deletions, no
consumer-facing changes beyond "you no longer install a thing you weren't
using."

The 🟡 items (§18–21) each warrant their own discussion thread or
sub-issue. Several tie directly to existing tracking issues
([#420][i420], [#428][i428], [#187][i187]).

[i187]: https://github.com/10up/10up-toolkit/issues/187
[i327]: https://github.com/10up/10up-toolkit/issues/327
[i420]: https://github.com/10up/10up-toolkit/issues/420
[i428]: https://github.com/10up/10up-toolkit/issues/428
[i451]: https://github.com/10up/10up-toolkit/issues/451
[i453]: https://github.com/10up/10up-toolkit/issues/453
[i454]: https://github.com/10up/10up-toolkit/issues/454
[i478]: https://github.com/10up/10up-toolkit/issues/478
[i480]: https://github.com/10up/10up-toolkit/issues/480
