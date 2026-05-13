# Can we deprecate `10up-toolkit` in favor of `@wordpress/build`?

A feasibility audit comparing:

- **10up-toolkit** v6.5.1 (`packages/toolkit` in `10up/10up-toolkit`)
- **`@wordpress/build`** v0.12.0 (`packages/wp-build` in `WordPress/gutenberg`)

The question driving this document: *can we stop maintaining 10up-toolkit and
have 10up projects build on top of `@wordpress/build` (plus whatever supporting
tools are needed)?*

### Scope

This audit is scoped to **monolithic WordPress projects only** — themes and
plugins that ship a single tree of PHP + JS/CSS, are installed into `wp-content`,
and are enqueued via WordPress's standard script/style registration.

We are explicitly **not** trying to preserve:

- **Package mode / distributable libraries** (10up-toolkit's `source`/`main`/
  `umd` library-bundling path)
- **CSS-in-JS** runtimes (Linaria, vanilla-extract)
- **Headless / decoupled** front-end builds
- Any other non-monolithic-WordPress output

Anything in those buckets is treated as out of scope below and removed from
the gap analysis. The relevant question is narrower: *can `@wordpress/build`
build a typical 10up theme or block-heavy plugin?*

---

## 1. Executive summary

**Short answer: no — `@wordpress/build` is not a viable replacement for a
typical monolithic WordPress theme or plugin build. It is solving a different
problem.**

`@wordpress/build` is a **monorepo bundler purpose-built for Gutenberg-style
plugins** — i.e. a plugin whose source is a tree of `@scope/<pkg>` npm
packages, each of which becomes one of `wp.<thing>` (or `myplugin.<thing>`),
plus an admin-page router and PHP autogeneration on top. It is, in essence,
"how Gutenberg builds itself, extracted into a package".

10up-toolkit, when stripped to its monolithic-WordPress responsibilities, is
the equivalent of `@wordpress/scripts`: a **project-level build system** with
multi-entry webpack, `block.json` discovery, HMR, image optimization, dev
server, and a full lint/format/test toolchain.

Even with package-mode, Linaria, and vanilla-extract dropped from the equation,
the structural mismatches that matter for theme/plugin work remain:
**no `block.json` discovery, no multi-entry project model, no HMR/dev server,
no lint/test/format, CSS is inlined into JS rather than emitted as enqueueable
stylesheets, no pluggable PostCSS chain (the entire plugin list is hardcoded),
fixed folder conventions that cannot be reconfigured, block plugin
registration explicitly flagged as still having "gaps that require manual
workarounds", and the entire PHP-generation flow assumes a Gutenberg-shaped
plugin.** None of these gaps are filled by dropping non-monolithic features
from toolkit — they're things `@wordpress/build` simply does not do. Several
of them are confirmed by the WordPress team itself in the
[announcement post][wp-blog] (see §1.1).

If we want to deprecate toolkit, the realistic target is **`@wordpress/scripts`**
(same problem domain, supported by the core WP team), not `@wordpress/build`.
This is also what **the WordPress team themselves recommend** for most users
today — see §1.1 below.

This document explains the gap concretely, feature by feature, with a
recommendation at the end.

### 1.1 What the WordPress team says about `@wordpress/build`

The official WP Developer Blog announcement
([JuanMa Garrido, April 2026][wp-blog]) and the corresponding vision issue
([gutenberg#72032 by Riad Benguella, Oct 2025][gh-72032]) clarify the intended
positioning of `@wordpress/build` — and it's strikingly modest:

- **It's for plugins, not themes.** The blog post explicitly frames it as
  "the next generation of WordPress plugin build tooling." Themes are not
  discussed at all in the announcement.
- **It's not a `@wordpress/scripts` replacement.** Per the blog:
  > "`@wordpress/build` is designed to become the engine underneath
  > `@wordpress/scripts`, not to replace it externally, but to power it from
  > within."
- **Most users should wait, not adopt.** Per the blog:
  > "Most developers who use `@wordpress/scripts` today will not need to
  > change anything when the transition happens. […] For most developers,
  > waiting for that convergence is the lower-friction path."
- **Block plugins — the most common WordPress plugin type — are explicitly
  not yet covered.** Per the blog:
  > "`@wordpress/build` is not ready for every use case yet. In particular, a
  > plugin registering blocks, a common entry point for WordPress plugin
  > developers, still has gaps that require manual workarounds."
- **Folder conventions are fixed and cannot be configured.** Per the blog:
  > "These folder names are fixed conventions — `packages/`, `routes/`,
  > `blocks/` cannot be renamed or pointed elsewhere via config or CLI
  > flags. If your project already uses these directory names for other
  > purposes, you'll need to restructure before adopting the tool."
- **The long-term direction is `@wordpress/scripts` v2** ([issue #72032][gh-72032],
  authored by Riad Benguella, Gutenberg lead, Oct 2025), not direct
  `@wordpress/build` adoption. That issue proposes `wp-scripts` itself move
  toward "convention over configuration" — auto-discovery of `pages/`,
  `fields/`, blocks, patterns, components — and possibly swap webpack/Babel
  for "esbuild or else" (i.e. consume `@wordpress/build` as an internal
  engine). The issue acknowledges current `wp-scripts` "fell into a gap of
  flexibility which basically meant complexity for everyone" — useful
  validation that the framework-level pain we feel in toolkit is felt by the
  core team too, and that their answer is convention-over-config tooling
  rather than a different general-purpose build tool.

**Implication for this audit:** the question "should we move from toolkit to
`@wordpress/build`?" is one the WordPress team has implicitly already
answered for us — *no, almost no one should be doing that yet, including
existing `@wordpress/scripts` users.* The supported migration path is to
`@wordpress/scripts`, with the wp-build speed benefits arriving later, for
free, when wp-scripts adopts it under the hood.

[wp-blog]: https://developer.wordpress.org/news/2026/04/wordpress-build-the-next-generation-of-wordpress-plugin-build-tooling/
[gh-72032]: https://github.com/WordPress/gutenberg/issues/72032

### 1.2 Is `@wordpress/scripts` being deprecated? No.

> [!IMPORTANT]
> **`@wordpress/scripts` is not being deprecated.** It is the WP team's
> long-term supported tool. This is a recent clarification and easy to miss
> if you saw early `@wordpress/build` discussions and assumed succession.

The plan in the WP team's own words:

1. **`@wordpress/scripts` keeps its name, package, and consumer-facing role.**
   Existing users don't migrate to a different package.
2. **`@wordpress/build` becomes its internal engine** at some point in the
   future — webpack/Babel get swapped out under the hood for the esbuild-based
   wp-build. From the blog post:
   > "`@wordpress/build` is designed to become the engine underneath
   > `@wordpress/scripts`, not to replace it externally, but to power it from
   > within."
3. **The API may evolve** (see [gutenberg#72032][gh-72032], "WordPress
   Scripts: A vision for a v2 version"). The proposal is to shift wp-scripts
   toward convention-over-configuration — auto-discovered `packages/`,
   `pages/`, `fields/`, blocks, patterns. But the package itself stays.

**Caveats** worth keeping in mind:

- **Timeline is uncommitted.** The blog post says "when the transition
  happens" — no version targeted, no roadmap. Could be a year, could be three.
- **"Not deprecated" ≠ "unchanged."** If #72032's vision lands, wp-scripts v2
  will look meaningfully different. Projects with heavy custom webpack config
  may need to adapt.
- **The engine swap is non-trivial.** Replacing webpack with wp-build inside
  wp-scripts is a substantial undertaking, and wp-build itself is "not ready
  for every use case yet." Expect slippage.

**Implication:** adopting `@wordpress/scripts` today is not a bet on a tool
that might disappear — it's a bet on the tool the WP team is actively
evolving. The wp-build engine gains arrive whenever they arrive, with no
action required from us.

---

## 2. Why the two tools are structurally mismatched

### 2.1 Different project models

A typical 10up project (`wp-scaffold`-style theme):

```
themes/my-theme/
├── assets/
│   ├── js/{admin,frontend,shared,styleguide}/
│   └── css/{admin,frontend,shared,blocks}/
├── includes/
│   └── blocks/<block-name>/block.json
└── package.json   # has "10up-toolkit": { ... }
```

A `@wordpress/build` project (must look like Gutenberg or close to it):

```
plugin-root/
├── packages/
│   ├── data/
│   │   ├── src/index.ts
│   │   └── package.json     # "wpScript": true, "main": "build/index.js", ...
│   ├── components/
│   └── editor/
├── routes/
│   └── settings/{stage.tsx,inspector.tsx,route.tsx}
└── package.json   # has "wpPlugin": { "scriptGlobal": "myplugin", ... }
```

`@wordpress/build` **walks `packages/*` looking for `package.json` files with
`wpScript: true`**. There is no concept of "the theme's frontend bundle" or
"the editor stylesheet" or "this block's view-script" — those don't exist
in its mental model. Every output is shaped like a versioned npm package
exposed on a global namespace.

To make a current 10up project build under `@wordpress/build` you would have
to restructure it into `packages/admin/`, `packages/frontend/`, `packages/blocks/`
etc., each with its own `package.json` declaring `wpScript: true` and the
appropriate `wpScriptModuleExports`. That is invasive, doesn't fit how WP
themes are conventionally built, and gives up most of the asset-output
conventions WordPress expects (a single `dist/js/frontend.js`, a single
`dist/css/style.css`, etc.).

### 2.2 No `block.json` awareness

`@wordpress/build` **has zero `block.json` support.** It does not glob for
`block.json` files, does not read `editorScript`/`viewScript`/`style`/etc.,
and does not copy `block.json` to the output directory. Blocks are not in
its vocabulary.

For 10up's block-heavy work this is the single biggest deal-breaker:
`useBlockAssets` (defaulted on in toolkit 6) is the most-used feature in the
toolkit, and there is no equivalent.

### 2.3 No HMR / dev server / Fast Refresh

`@wordpress/build` ships a `--watch` flag (chokidar-based incremental rebuild)
and nothing else. There is no `webpack-dev-server` equivalent, no React Fast
Refresh, no BrowserSync. Developers writing UI would lose the HMR/Fast Refresh
flow 10up engineers currently rely on.

### 2.4 No lint / test / format

10up-toolkit ships `lint-js`, `lint-style`, `format-js`, `test-unit-jest`, plus
in-build linting via `eslint-webpack-plugin` and `stylelint-webpack-plugin`. It
also ships `@10up/eslint-config`, `@10up/stylelint-config`, and
`@10up/babel-preset-default` as sibling packages. `@wordpress/build` ships none
of this and **explicitly defers it to the consumer** (it has its own
`eslint-overrides.cjs` for the Gutenberg repo but no commands).

### 2.5 PHP generation is plugin-shaped, not theme-shaped

`@wordpress/build` generates `build/build.php` plus `scripts.php`, `modules.php`,
`styles.php`, `constants.php`, `routes.php`, `pages.php` — all designed to be
`require_once`'d from a plugin's main file (`plugin_dir_url(__FILE__)`). It
requires `wpPlugin.name`, `wpPlugin.scriptGlobal`, etc. to be set in the root
`package.json`. That model just doesn't apply to a 10up theme.

---

## 3. Feature-by-feature gap analysis

Legend:
- ✅ Covered by `@wordpress/build`
- 🟡 Partially covered — usable but requires changes
- ❌ Not covered — would need a different tool
- ⛔ Not covered AND structurally incompatible — i.e. couldn't add it without
  forking `@wordpress/build`

### 3.1 Build pipeline

| 10up-toolkit feature | wp-build status | Replacement / mitigation |
|---|---|---|
| Multi-entry webpack (admin/frontend/shared/blocks/styleguide) | ⛔ | Out of scope — wp-build builds per-package, not per-entry |
| `block.json` auto-discovery (`useBlockAssets`) | ⛔ | Use `@wordpress/scripts` (it has equivalent) |
| Per-block CSS auto-enqueue (`loadBlockSpecificStyles`) | ❌ | Custom postbuild or wp-scripts plugin |
| `webpack.config.js` override | ⛔ | No escape hatch in wp-build at all |
| `--analyze` (bundle analyzer) | ❌ | esbuild-visualizer or similar |
| `--sourcemap` toggle | 🟡 | wp-build always emits sourcemaps |
| Code splitting / runtime chunk | ⛔ | esbuild splits less aggressively; not configurable through wp-build |
| Public path / `ASSET_PATH` | ❌ | Not supported |
| Configurable source directories (`paths.config.js`) | ⛔ | wp-build uses **fixed conventions** — `packages/`, `routes/`, `blocks/` cannot be renamed or pointed elsewhere via config or CLI flags (per the [WP Developer Blog announcement][wp-blog]) |
| Block plugin registration | ⛔ | The WP team explicitly notes this still has "gaps that require manual workarounds" — see [blog post][wp-blog] |

> Package-mode library bundling (`source`/`main`/`umd`) is **out of scope** —
> we are not preserving distributable-package builds.

### 3.2 JS/TS transpilation

| Feature | wp-build | Replacement |
|---|---|---|
| Babel via `@10up/babel-preset-default` | ⛔ | wp-build is esbuild-only — no Babel pipeline. Babel is only invoked for one Gutenberg package (`@wordpress/components` + emotion) |
| `core-js@3` polyfill injection | ❌ | Would need standalone polyfill bundle |
| TypeScript support | ✅ | esbuild transpiles TS natively |
| TypeScript type-checking | ❌ | wp-build does not run `tsc`; toolkit ships a `TenUpToolkitTscPlugin` that runs it in parallel |
| JSX | ✅ | `jsx: 'automatic'` |
| Custom user Babel config | ⛔ | Not supported |
| browserslist | ✅ | wp-build reads project browserslist via `browserslist-to-esbuild` |

### 3.3 CSS/SCSS/PostCSS

| Feature | wp-build | Replacement |
|---|---|---|
| SCSS | ✅ | `sass-embedded` + `esbuild-sass-plugin` |
| PostCSS pipeline | ⛔ | **Hardcoded** — not user-configurable (see 3.3.1) |
| `postcss-preset-env` | ⛔ | Not present and no hook to add it |
| `postcss-import` | ⛔ | Sass `@use`/`@forward` partially covers it; no way to add the plugin |
| `postcss-mixins` + global mixins/global-data | ⛔ | Sass mixins are a substitute; no plugin hook |
| `postcss-editor-styles-wrapper` | ⛔ | No way to add it |
| CSS Modules (`*.module.css`) | ✅ | Implemented inline-style style |
| CSS extracted to standalone files | ⛔ | wp-build **inlines** CSS as JS that injects `<style>` tags; only top-level `style.css` is extracted as a file. **Hard blocker for WP enqueue model.** |
| Stylelint integration | ❌ | Run as a separate npm script |
| Automatic RTL stylesheets | ✅ | wp-build wins — `rtlcss` baked in. toolkit has nothing |
| User PostCSS config auto-detect (`postcss.config.{js,cjs,mjs}`, `.postcssrc*`) | ⛔ | Not supported in v0.12.0 |
| Per-package PostCSS override (`wpPostcss`) | ⛔ | Not supported in v0.12.0 |

> Linaria and vanilla-extract are **out of scope** — we are not preserving
> CSS-in-JS pathways.

#### 3.3.1 PostCSS support in `@wordpress/build`, in detail

This is significant enough to call out separately. As of **v0.12.0** the PostCSS
support in `@wordpress/build` is **not pluggable**. Plugin lists are hardcoded
inline in `lib/build.mjs` in three places:

1. **Inline CSS path** (CSS files imported by JS, used by the components
   package and routes) — `lib/build.mjs:188-204`:
   ```js
   const plugins = [
       dsTokenFallbacks,           // optional, only if @wordpress/theme installed
       cssModules && postcssModules({ generateScopedName: '[contenthash]__[local]', ... }),
       minify   && cssnano({ preset: ['default', { discardComments: { removeAll: true } }] }),
   ].filter(Boolean);
   ```

2. **SCSS entry-point path** (`build-style/` outputs) — `lib/build.mjs:1488-1497`:
   ```js
   const ltrResult = await postcss(
       [ dsTokenFallbacks, autoprefixer({ grid: true }) ].filter(Boolean)
   ).process(source, { from: undefined });
   const rtlResult = await postcss([ rtlcss() ]).process(ltrResult.css, ...);
   ```

3. **Static CSS minification** in `build-style/` → `build/styles/` —
   `lib/build.mjs:704`: just `cssnano`.

There is **no `postcss.config.js` discovery, no `wpPostcss` field, no plugin
array to inject into**. The only "configuration" knobs are env vars
(`IS_GUTENBERG_PLUGIN`, `IS_WORDPRESS_CORE`) and the optional `@wordpress/theme`
peer dependency (which adds a design-system token fallback plugin).

That means **none of the following work out of the box, and there is no hook
to add them**:

| 10up-toolkit default PostCSS plugin | Works in wp-build? |
|---|---|
| `postcss-import` | ❌ |
| `@csstools/postcss-global-data` (cross-file custom property exposure) | ❌ |
| `postcss-mixins` (project-level mixin files) | ❌ |
| `postcss-preset-env` stage 0 | ❌ |
| `postcss-editor-styles-wrapper` (Gutenberg editor scoping) | ❌ |
| `cssnano` in production | ✅ baked in |

**A design proposal exists** for pluggable PostCSS support — see
`packages/wp-build/docs/postcss-configuration-architecture.md` in the
Gutenberg repo. It describes a `lib/postcss-config.mjs` module supporting
`postcss.config.{js,cjs,mjs}` discovery, a `wpPostcss` package field, and
plugin arrays in either string, `[name, options]`, or pre-instantiated form.

**It has not been implemented.** No such module exists in `lib/`, the
`yaml` dependency the design calls for is present but unused for this
purpose, and v0.12.0's `compileStyles`/`compileInlineStyle` still use the
hardcoded plugin arrays shown above. There is no public roadmap commitment
to ship it.

**Implication:** every PostCSS plugin in 10up-toolkit's default chain — the
single most user-visible "feature" that distinguishes a 10up project's CSS
authoring experience — is **inaccessible** through `@wordpress/build`. Even
if the design proposal ships, the inline-CSS path (CSS-as-JS) appears to be
out of scope for it, so 10up-style projects that rely on PostCSS features
in CSS modules or component-scoped CSS would still be partially uncovered.

By comparison, **`@wordpress/scripts` does respect a project-level
`postcss.config.js`** through its webpack `postcss-loader` integration. Any
plugin chain you want — `postcss-preset-env`, `postcss-import`,
`postcss-mixins`, `postcss-editor-styles-wrapper`, the lot — works as it
does in toolkit today. This is the cleanest argument for Option A over
adopting `@wordpress/build`.

### 3.4 WordPress integration

| Feature | wp-build | Replacement |
|---|---|---|
| `*.asset.php` generation | ✅ | Custom externals plugin generates them |
| `@wordpress/*` externalization | ✅ | Built-in |
| `jquery`/`lodash` externalization | ✅ | Built-in |
| Multi-namespace externalization (e.g. `@woo/*`) | ✅ | wp-build wins — toolkit has no equivalent |
| Custom handle prefixes | ✅ | wp-build wins |
| Script Module support | ✅ | First-class in wp-build via `wpScriptModuleExports` (toolkit has `--block-modules` as a limited equivalent) |
| `block.json` copy + path transforms | ⛔ | No — **blocks aren't in wp-build's model** |
| Block PHP file copy | ❌ | No |
| CSS emitted as standalone files for `wp_enqueue_style` | ⛔ | No — wp-build inlines CSS into JS (see 3.3) |

### 3.5 Dev experience

| Feature | wp-build | Replacement |
|---|---|---|
| Watch mode | ✅ | chokidar-based |
| HMR | ❌ | None — would need wp-scripts or custom webpack |
| Dev server | ❌ | None |
| React Fast Refresh | ❌ | None |
| BrowserSync | ❌ | None |
| Smart dependency-graph re-bundling on watch | ✅ | wp-build wins (it walks dependents) — only matters in monorepo mode |
| Source maps in dev | ✅ | Always on |

### 3.6 Assets / static files

| Feature | wp-build | Replacement |
|---|---|---|
| Image minification (jpeg/png/webp/avif via `sharp`) | ❌ | Standalone npm script (e.g. `sharp-cli`, `imagemin`) |
| SVG minification via SVGO + `svgo.config.js` | ❌ | Standalone |
| SVG → React component (`@svgr/webpack`) | ❌ | Standalone or inline imports |
| `CopyWebpackPlugin`-style static asset copy | 🟡 | wp-build has `wpCopyFiles` (per-package, simpler model) |
| Font/image module imports | 🟡 | esbuild handles imports natively |

### 3.7 Tooling: lint / format / test

| Feature | wp-build | Replacement |
|---|---|---|
| ESLint CLI (`lint-js`) | ❌ | Install `eslint` directly + `@10up/eslint-config` |
| Stylelint CLI (`lint-style`) | ❌ | Install `stylelint` directly + `@10up/stylelint-config` |
| Prettier (`format-js`) | ❌ | Install `prettier` directly |
| In-build ESLint (`eslint-webpack-plugin`) | ❌ | Lose this — run on file save in IDE / pre-commit hooks |
| In-build Stylelint | ❌ | Same |
| Jest (`test-unit-jest`) | ❌ | Install `jest` + `babel-jest` directly |

### 3.8 PHP generation (wp-build's selling point)

These are things `@wordpress/build` does that toolkit doesn't:

| Feature | Useful for 10up? |
|---|---|
| Aggregate `build/build.php` registration | 🟡 — most 10up themes register scripts manually in PHP |
| Script/module registries (`scripts.php`/`modules.php`) | 🟡 |
| `constants.php` (version, build URL) | 🟡 |
| `routes.php` / file-based admin router | ❌ — almost no 10up theme has an SPA admin UI |
| `pages.php` admin-page generation | ❌ |
| PHP function-prefix / class-suffix transforms | ❌ — Gutenberg-specific |

The PHP-generation features are essentially **only valuable to teams building
a Gutenberg-style plugin**. They don't translate to typical 10up theme work.

---

## 4. What would a "post-toolkit" 10up stack actually look like?

If we *did* want to leave toolkit, the realistic shape is **not** `@wordpress/build`
alone. It's a combination. Here's what would be needed:

### Option A — Move to `@wordpress/scripts` (recommended)

`@wordpress/scripts` is the closest direct replacement: same problem domain
(monolithic WordPress theme/plugin build), already covers most of what
10up-toolkit does once non-monolithic features are dropped, maintained by
the WP core team. It is also **the path the WordPress team itself recommends**
([blog post][wp-blog], [vision issue #72032][gh-72032]):

> "Most developers who use `@wordpress/scripts` today will not need to change
> anything when the transition happens." — *WP Developer Blog, Apr 2026*

`@wordpress/scripts` v2 (per #72032) is the long-term target the WP team is
building toward, and `@wordpress/build` is intended to be its internal
engine. So adopting `@wordpress/scripts` today also positions us on the
supported path to whatever speed/UX gains the wp-build engine eventually
brings — without an interim restructuring.

| Capability | Source |
|---|---|
| Multi-entry build, `block.json` discovery, `.asset.php` | `@wordpress/scripts` |
| HMR / dev server | `@wordpress/scripts` (`start --hot`) |
| ESLint / Stylelint / Prettier configs | `@wordpress/eslint-plugin`, `@wordpress/stylelint-config`, `@wordpress/prettier-config` (or keep `@10up/*` configs) |
| Jest | `@wordpress/scripts test-unit-js` |
| TypeScript | `@wordpress/scripts` (Babel-based) |
| Image optimization | Standalone npm script (e.g. `sharp-cli`) — lost from toolkit |
| Per-block style auto-enqueue | Custom postbuild step (small) |
| `postcss-editor-styles-wrapper` | Project-level `postcss.config.js` — **wp-scripts respects it** (wp-build does not) |
| 10up's opinionated PostCSS chain (`postcss-preset-env`, `postcss-global-data`, `postcss-mixins`, `postcss-import`) | Project-level `postcss.config.js` — **wp-scripts respects it** (wp-build does not) |
| Stylelint integration | `@wordpress/scripts lint-style` |

**What we'd give up:** image minification (move to standalone tool),
per-block style auto-enqueue (small postbuild script), bundle analyzer
(`@statoscope/webpack-plugin` or similar).

**What we'd gain:** zero in-house maintenance burden; alignment with WP core
release cadence; same `block.json` model the rest of the WP ecosystem uses.

Within the in-scope feature set (monolithic WP, no CSS-in-JS, no package
mode), `@wordpress/scripts` covers an estimated ~85–90% of toolkit out of the
box. The remaining ~10% is project-level config (postcss plugins, lint configs)
or thin standalone scripts (image opt).

#### Gaps in `@wordpress/scripts` relative to toolkit (concrete list)

Things toolkit does today that `@wordpress/scripts` does not. Each would need
either a project-level workaround, a small standalone tool, or to be carried
forward inside a thin 10up wrapper.

1. **Image minification.** Toolkit ships `image-minimizer-webpack-plugin` +
   `sharp` for JPEG/PNG/WebP/AVIF, plus SVGO with `svgo.config.js`
   auto-discovery. wp-scripts ships no image optimization step. → Move to a
   standalone `sharp-cli` / `imagemin` npm script.
2. **Default PostCSS plugin chain.** Toolkit ships `postcss-import` +
   `@csstools/postcss-global-data` (auto-loads `globalStylesDir/**/*.css`) +
   `postcss-mixins` (auto-loads `globalMixinsDir/**/*.css`) +
   `postcss-preset-env` stage 0 + conditional `postcss-editor-styles-wrapper`
   for `editor-style.css`. wp-scripts respects a project-level
   `postcss.config.js` but **ships none of these plugins**. → Either install
   them per-project, or maintain a shared `@10up/postcss-config` package.
3. **Per-block style auto-enqueue** (`loadBlockSpecificStyles`). Toolkit
   globs `assets/css/blocks/**/*.{css,scss,sass}` and emits
   `autoenqueue/<block>` entry points automatically. → Custom postbuild
   script.
4. **`postcss-editor-styles-wrapper` auto-application** to `editor-style.css`.
   Toolkit conditionally wires this in based on filename. → Manual setup in
   the project's `postcss.config.js`.
5. **Multi-entry default conventions** (admin / frontend / shared /
   styleguide buckets). Toolkit ships these pre-wired. wp-scripts defaults to
   single-entry with multi-entry available through different config
   conventions. → Reconfigure each project once.
6. **10up's opinionated lint configs.** `@10up/eslint-config` and
   `@10up/stylelint-config` carry 10up-specific rules. wp-scripts ships
   `@wordpress/eslint-plugin`, which is a different opinion. → Keep
   maintaining the `@10up/*` configs as standalone packages.
7. **`@10up/babel-preset-default`.** 10up-specific Babel preset. → Keep
   maintaining it standalone, or align on the WP preset.
8. **Built-in BrowserSync auto-detection.** Toolkit auto-detects
   `browser-sync-webpack-plugin` when installed. wp-scripts doesn't integrate
   it. → Drop or wire up manually.
9. **HMR allowed-hosts conventions.** Toolkit's dev server defaults to
   allowing `.test` and `.local` subdomains plus the `devURL` host (matches
   typical Local/Lando setups). wp-scripts requires explicit allowed-hosts
   config. → One-time project config.
10. **TypeScript type-checking via parallel `tsc`** (`TenUpToolkitTscPlugin`).
    Toolkit runs `tsc` alongside the build for type errors. wp-scripts
    transpiles TS via Babel but doesn't run type-checking automatically. →
    Add `tsc --noEmit` as a separate npm script.
11. **`buildfiles.config.js` / `paths.config.js`** overrides. Toolkit's
    flexible per-project entry/path overrides. wp-scripts uses different
    convention model (`--webpack-src-dir`, etc.). → Reconfigure each project.

> Some additional wp-scripts behavior (bundle analyzer surface, exact static
> asset copy semantics, `block.json` PHP file copy) was not verified in depth
> for this audit. A wp-scripts source audit should be the next step before
> committing to Option A.

### Option B — Trim toolkit (keep webpack)

Drop the out-of-scope features from toolkit itself:

- Remove Linaria support and the `@linaria/*` peer deps.
- Remove vanilla-extract support and the webpack plugin.
- Remove package mode (`source`/`main`/`umd` library bundling).
- Remove the `--block-modules` dual-config path if module/non-module split
  isn't needed.

This shrinks the dependency surface (drop ~5 peer deps, ~3 webpack plugins,
both CSS-in-JS pipelines, and the package-mode config branch) and leaves a
focused monolithic-WordPress build tool that's cheaper to maintain. The
project shape stays the same — it just stops trying to be three tools at
once. Zero external migration cost for consumers.

**Scoring against goals:** ergonomics ✅, easy migration ✅, lower
maintenance 🟡 (reduced but still ours), faster builds 🟡 (no change unless
paired with Option C's engine swaps).

This is a defensible middle option if Option A's gaps are unacceptable and
the team wants minimum disruption. It's a stepping stone — not the
end state — because it doesn't address goal #1 (faster builds) and doesn't
materially reduce the maintenance burden of webpack/Babel/PostCSS
ecosystem upgrades.

### Option C — Trim toolkit + modernize engines (rspack + Biome)

A variant of Option B where we trim **and** swap the slow parts of the
engine. Covered by existing tracking issues:

- **#451 — Replace webpack with rspack.** rspack is largely
  webpack-API-compatible, so most of toolkit's webpack config carries over.
  Build speeds approach esbuild/wp-build territory without changing what
  toolkit produces or how consumers configure it.
- **#478 — Replace ESLint + Prettier + Stylelint with Biome (or OXC).**
  Single Rust-based tool for lint + format. Significant speedup and a
  large reduction in the linter peer-dependency matrix we currently maintain.
- Bundle these with the Option B trim work so it's a single major version.

**Scoring against goals:** ergonomics ✅ (nothing user-visible regresses;
all toolkit conventions intact), easy migration ✅ (rspack is API-compatible;
Biome migration is one-time work inside `@10up/eslint-config` /
`@10up/stylelint-config`), faster builds ✅, lower maintenance 🟡 (still ours,
but the Babel toolchain and ESLint-plugin ecosystem largely disappear).

**Trade-offs / risks:**

- **Biome lint coverage is still narrower than ESLint's plugin ecosystem.**
  Some rules in `@10up/eslint-config` may not have Biome equivalents yet —
  needs a rule-by-rule audit before committing.
- **rspack version churn is real.** Stable trajectory, responsive team, but
  pinning will be a recurring task.
- **Diverges further from WP core direction** (which is heading toward
  esbuild via wp-build). We'd be on a parallel track, which is fine for
  speed today but means we don't inherit wp-build engine improvements when
  they eventually land in wp-scripts.

This is the option that wins on goal #1 (faster builds) without paying the
migration cost of Option A. It's the strongest answer if "we want toolkit
to feel faster, soon, without uprooting projects."

### Option D — Adopt `@wordpress/build` for Gutenberg-style plugin work only

`@wordpress/build` could be a fit *for a specific kind of new 10up plugin*:
one that is structured like Gutenberg (monorepo of `@10up/*` packages exposed
on a global), with an admin SPA, where script-module dependency wiring and
PHP autogeneration carry their weight. This is a niche we don't currently
build much, and even there the WP team flags significant gaps:

> "`@wordpress/build` is not ready for every use case yet. In particular, a
> plugin registering blocks, a common entry point for WordPress plugin
> developers, still has gaps that require manual workarounds." — *WP Developer
> Blog, Apr 2026*

It does **not** replace toolkit for theme work or for typical block-heavy
plugin work. The blog post's own guidance is:

> "For most developers, waiting for that convergence [with @wordpress/scripts]
> is the lower-friction path." — *WP Developer Blog, Apr 2026*

---

## 5. Migration cost if we *did* try to move

For a typical block-heavy 10up theme moving from toolkit → `@wordpress/build`:

1. **Restructure the codebase as a monorepo** of `packages/*`. Realistic
   effort: days to weeks per project, depending on how many shared modules
   there are. Themes don't normally have this shape.
2. **Re-author `block.json` handling.** Each block becomes its own `package`
   directory or you write custom build steps. This is the deepest gap and
   it does **not** get smaller when we drop non-monolithic features —
   blocks are central to the monolithic case.
3. **Replace HMR/Fast Refresh workflow.** Probably means bolting wp-scripts on
   the side, which defeats the point.
4. **Replace linting/testing/formatting.** Install ~7 dev dependencies per
   project and copy configs.
5. **Replace image optimization** with a standalone tool.
6. **Re-author PHP enqueue logic** to consume `@wordpress/build`'s generated
   PHP, or ignore it and roll your own.
7. **Re-author CSS enqueueing.** wp-build inlines CSS into JS; getting
   standalone stylesheets out of it for `wp_enqueue_style` requires
   bypassing its style pipeline.

For a typical theme this is **a re-platforming exercise, not a migration**.
The yield in maintenance savings doesn't justify the cost unless 10up
restructures how it ships theme/plugin work. Narrowing the scope to
monolithic WP doesn't change this — the blockers (no block.json, no
multi-entry, no enqueueable CSS, no HMR) are exactly the parts we *want*
to keep.

For a brand-new Gutenberg-style plugin (rare but possible), starting on
`@wordpress/build` directly is reasonable.

---

## 6. Recommendation

1. **Do not deprecate `10up-toolkit` in favor of `@wordpress/build` directly.**
   They solve different problems; the gap is wide enough that calling it a
   "replacement" is misleading. Scoping toolkit to monolithic WordPress only
   does not close the gap — the blockers (no `block.json`, no multi-entry,
   CSS inlined into JS, no HMR, monorepo-only project model, **no pluggable
   PostCSS chain**) are independent of CSS-in-JS or package-mode features.
2. **`@wordpress/scripts` is not being deprecated** (see §1.2). It is the
   WP team's supported long-term tool, with `@wordpress/build` slated to
   become its internal engine — not its replacement. Adopting wp-scripts
   today positions us on the supported path and inherits the future speed
   gains "for free" when the engine swap lands.
3. **If we want to deprecate toolkit, the realistic target is `@wordpress/scripts`
   (Option A).** It has the same project model, covers ~85–90% of what a
   trimmed-to-monolithic toolkit does, and is maintained by the core WP team.
   The remaining 10–15% (image optimization, per-block style auto-enqueue,
   the 10up PostCSS preset chain, lint configs) is either replaced with
   standalone tools, moved into project-level `postcss.config.js`, or
   carried forward as the existing `@10up/eslint-config` /
   `@10up/stylelint-config` standalone packages. See the concrete gaps list
   under Option A.
4. **If speed matters more than external migration, modernize toolkit
   (Option C).** Pair the Option B trim work with #451 (rspack) and #478
   (Biome). This hits goal #1 (faster builds) without paying the migration
   cost of Option A and without giving up any toolkit ergonomics. The
   trade-off is that we diverge further from the WP core direction.
5. **Option B (trim only) is a stepping stone, not an end state.** It
   reduces surface area but doesn't address goal #1 (faster builds) or
   materially reduce the maintenance burden of webpack/Babel/PostCSS
   ecosystem upgrades. Use it as a transitional state on the way to A or C.
6. **`@wordpress/build` (Option D) is worth watching, not adopting today.**
   This is what the WordPress team themselves recommend in the
   [announcement blog post][wp-blog]: *"For most developers, waiting for that
   convergence is the lower-friction path."* If 10up starts building
   Gutenberg-style plugins (monorepo of packages exposed on a global
   namespace, admin SPA, etc.), `@wordpress/build` becomes the right tool
   for that specific use case — but even there, block plugin registration
   still has gaps requiring manual workarounds per the same announcement. It
   is not a fit for the monolithic theme/plugin work that drives toolkit
   usage.
7. **Useful capabilities to selectively pull from `@wordpress/build`** even
   while keeping toolkit:
   - Automatic LTR/RTL stylesheet generation (`rtlcss`).
   - Multi-namespace externalization (`externalNamespaces`) — relevant if 10up
     ever ships plugins that integrate with WooCommerce or other platforms
     that expose their own globals.
   - The PHP registration generation pattern (constants.php / scripts.php /
     styles.php) — could simplify a lot of theme enqueue boilerplate, but
     this is an idea to steal, not a dependency to take.

### Decision shape

The real choice is between **A** (external migration, lower long-term
maintenance, defers speed) and **C** (no migration, immediate speed gains,
divergence from WP core). **B** is a useful first step toward either. **D**
is not on the table for our typical workload.

---

## Appendix: feature inventory (reference)

For completeness, here is the underlying feature inventory the analysis is
based on.

### A.1 CLI surface

**10up-toolkit** dispatches via `bin/10up-toolkit.js` to:
`build`, `start`, `watch`, `format-js`, `lint-js`, `lint-style`,
`test-unit-jest`, `test-unit-js`, `check-engines`, `project init/build/generate-ci`.

**`@wordpress/build`** ships a single binary `wp-build` with flags:
`--watch`/`-w`, `--base-url <expr>`.

### A.2 Engines

| Tool | Bundler | Transpiler | Watcher | CSS engine |
|---|---|---|---|---|
| 10up-toolkit | webpack@^5.89 | babel-loader@^9 + `@10up/babel-preset-default` | webpack | sass-loader + postcss-loader + css-loader + mini-css-extract |
| @wordpress/build | esbuild@^0.27 | esbuild native (+ Babel only for emotion) | chokidar@^4 | esbuild-sass-plugin + sass-embedded; CSS inlined via postcss |

### A.3 Output shape

**10up-toolkit (project mode):**
```
dist/
├── js/<name>.js
├── js/<name>.[hash].chunk.js
├── css/<name>.css
├── blocks/<name>/editor.{js,css}
├── *.asset.php
└── (copied: images, fonts, block.json, block PHP)
```

**10up-toolkit (package mode):** `dist/index.js`, `dist/index.css`, optional UMD.

**`@wordpress/build`:**
```
packages/<name>/
├── build/             # CJS, per-file
└── build-module/      # ESM, per-file
build/
├── build.php / constants.php / scripts.php / modules.php / styles.php / routes.php / pages.php
├── scripts/<pkg>/{index.js, index.min.js, index.min.asset.php}
├── modules/<pkg>/<export>.{js,min.js,min.asset.php}
├── styles/<pkg>/{style.css, style-rtl.css, style.min.css, style-rtl.min.css}
├── routes/<route>/{route.js, content.js, ...min.js, ...asset.php}
└── pages/<page>/{page.php, page-wp-admin.php}
```

### A.4 Configuration model

**10up-toolkit:** `package.json#10up-toolkit` + optional
`buildfiles.config.js`, `filenames.config.js`, `paths.config.js`,
`postcss.config.js`, `babel.config.js`, `webpack.config.js` (full override),
`svgo.config.js`, etc. Env vars: `NODE_ENV`, `TENUP_NO_EXTERNALS`,
`BABEL_CACHE_DIRECTORY`, `ASSET_PATH`.

**`@wordpress/build`:** root `package.json#wpPlugin` (`name`, `scriptGlobal`,
`packageNamespace`, `handlePrefix`, `externalNamespaces`, `pages`) plus
per-package fields (`wpScript`, `wpScriptModuleExports`,
`wpScriptDefaultExport`, `wpScriptExtraDependencies`, `wpStyleEntryPoints`,
`wpCopyFiles`, `wpWorkers`). Env vars: `IS_GUTENBERG_PLUGIN`,
`IS_WORDPRESS_CORE`. **No escape hatch** for the build pipeline itself.

### A.5 Unique to each

**Only in 10up-toolkit:** project vs package mode auto-detection, React Fast
Refresh, dev server, BrowserSync, `block.json` discovery, per-block style
auto-enqueue, image minimization, bundle analyzer, HtmlWebpackPlugin demos,
WebpackBar, `@svgr/webpack`, `postcss-editor-styles-wrapper`,
`postcss-global-data` + `postcss-mixins`, ESLint/Stylelint/Babel preset
siblings, Jest, Prettier.

**Only in `@wordpress/build`:** topological monorepo build order, smart
dependency-graph rebundling on watch, file-based admin routes, admin page
generation (two modes) + init modules, automatic LTR+RTL stylesheets,
always-dual minified+unminified output with `SCRIPT_DEBUG` define, WASM
inlining, declarative Web Worker bundles with resolve redirects, PHP function-
prefix and class-suffix transforms, CSS content-hash dedupe at runtime,
moment-timezone shim, per-namespace handle prefixes, multi-namespace
externalization.
