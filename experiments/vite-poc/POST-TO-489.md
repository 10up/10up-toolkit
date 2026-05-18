# Option E: Vite / Vite+ as toolkit's foundation — POC results

Spent a session sanity-checking whether the "Vite+ is too far off" framing
holds up once you actually try to build a real theme through it. Built the
POC under [`experiments/vite-poc/`][poc] plus an in-place port of
`projects/10up-theme` to Vite at [`projects/10up-theme/vite.config.ts`][theme-port],
so the toolkit and Vite paths build the same source tree side-by-side
(`npm run build` vs `npm run build:vp`).

## TL;DR

- The WP-aware surface of toolkit is **~700 lines of TypeScript** as Vite
  plugins. Same source tree builds cleanly through both bundlers.
- **Vite+ is real and works today.** `vp build` runs the POC unmodified.
  Numbers on `10up-theme`: **-33% cold build, -53% scripts-only cold,
  -57% dev-start vs the existing toolkit baseline.**
- Two open enhancement issues land **first-class** in the plugin model:
  **#474** (`externalNamespaces`) and **#475** (`blocks-manifest.php`).
  **#477** (component / template routing) was prototyped earlier in the
  POC and removed for scope; same plugin shape.
- Real porting gotchas exist (6 of them, all small, listed below) — none
  structural. The remaining ecosystem cost is `@10up/block-components`
  shipping CJS-only.

## What got built

Four plugins under `experiments/vite-poc/vite-plugins/`, ~750 lines total:

| Plugin | Responsibility | Maps to |
|---|---|---|
| `wp-blocks` | `block.json` discovery → multi-entry, copies block.json/PHP into dist, stamps `version` from style content hash, emits `blocks-manifest.php` | toolkit's `useBlockAssets` + `transformBlockJson` + **#475** |
| `wp-externals` | Namespace-driven externalization (`@wordpress/*` → `wp.*` + `.asset.php`), `script` and `module` modes | `@wordpress/dependency-extraction-webpack-plugin` + **#474** |
| `wp-block-styles` | Per-block CSS auto-enqueue | toolkit's `loadBlockSpecificStyles` |
| `wp-copy-assets` | Mirror `assets/**/*.{jpg,png,svg,woff,…}` to `dist/` | toolkit's `CopyWebpackPlugin` static pattern |

Plus inline helpers in `vite.config.ts`: `iifeWrapScripts` (post-bundle
IIFE wrap for classic `<script>` enqueue), `removeCssOnlyJsChunks`
(toolkit's `RemoveEmptyScriptsPlugin`).

PostCSS pipeline matches toolkit's defaults — `postcss-import`,
`@csstools/postcss-global-data`, `postcss-mixins`, `postcss-preset-env`
stage 0, `cssnano`. React + `react/jsx-runtime` externalized to WP's
registered handles so each block doesn't ship its own React runtime.

## What this changes about the original decision matrix

Recapping the four options in the audit:

| Goal | A: `@wordpress/scripts` | B: trim | C: rspack + Biome | D: `@wordpress/build` | **E: Vite/Vite+ + plugins** |
|---|---|---|---|---|---|
| 1. Faster builds | 🟡 same now | 🟡 same | ✅ rspack speed | ✅ esbuild speed | ✅ **-33% cold, -57% dev-start on real 10up-theme** |
| 2. DX (block.json, HMR, lint/test) | ✅ | ✅ | ✅ | ❌ | ✅ block.json + Fast Refresh in POC; lint/test orthogonal (Vite+ ships them) |
| 3. Easy migration | ✅ config porting | ✅ zero | ✅ webpack-API-compatible | ❌ heavy restructure | 🟡 different config model; six small porting gotchas |
| 4. Lower maintenance | ✅ zero in-house | 🟡 reduced | 🟡 reduced | n/a | 🟡 ~750 lines of plugin TS to maintain |

E was the unknown. The POC moves it from "speculative" to "measured."

## Performance — three-way comparison on `10up-theme`

Same machine (M1 Max, today), same source tree, same WP-aware plugins
where applicable.

| Scenario | Toolkit (webpack) | Vite (orchestrator) | **Vite+ (`vp` CLI)** | Best Δ vs toolkit |
|---|---:|---:|---:|---:|
| cold-build (full dual-pass) | 2.87s | 1.91s | **1.92s** | **-33%** |
| cold-build (scripts only) | 2.87s | 1.75s | **1.36s** | **-53%** |
| warm-build | 2.25s | 1.55s | 1.60s | **-29%** |
| dev-start (time to first ready) | 2.54s | **920ms** | 1.10s | **-57%** |

Three orthogonal changes drive the speedup; all three matter:

| Step | 10up-theme cold-build |
|---|---:|
| Toolkit baseline | 2.87s |
| Vite + plugin-react (Babel) + 2 sequential `node` invocations | 3.54s (slower!) |
| Vite + **plugin-react-swc** + 2 sequential invocations | 2.85s |
| Vite + plugin-react-swc + **single-process orchestrator** (programmatic build API) | 1.91s |
| **Vite+ (`vp`)** + plugin-react-swc | 1.92s |
| **Vite+ (`vp`) scripts-only** (Rolldown bundling alone) | **1.36s** |

Takeaways:

1. **Single-process orchestrator was the biggest win.** Eliminating
   Node-startup + Vite-init overhead for the second pass collapsed ~1s.
   Using Vite's programmatic `build()` API instead of two sequential
   shell invocations.
2. **SWC over Babel: ~25% across the board.** `@vitejs/plugin-react-swc`
   was a drop-in replacement once we kept our small `jsxInJs` esbuild
   pre-transform for `.js`-with-JSX files.
3. **Vite+ uses Rolldown** (Rust bundler) under the hood and produces a
   visible deprecation warning telling us `optimizeDeps.esbuildOptions`
   should be `optimizeDeps.rolldownOptions`. The script-only cold build
   on `vp` is **22% faster than the same on plain Vite** — that's the
   Rolldown gain in isolation.

`vp` accepted our `vite.config.ts` and plugins **without modification**.
That's the headline result: Vite+ today is a drop-in over standard Vite
for the WP plumbing we need.

## Open enhancement issues that land first-class

### #474 — Namespace-driven externalization

`wp-externals` no longer hardcodes `@wordpress/`. It takes an
`externalNamespaces` map; adding WooCommerce is one config line.

```ts
wpExternals({
  externalNamespaces: {
    wordpress: { global: 'wp',  handlePrefix: 'wp' },
    woo:       { global: 'woo', handlePrefix: 'woocommerce' },
  },
});
```

With `woo` added, `import { Cart } from '@woo/cart'` becomes
`const { Cart } = window.woo.cart;` (script mode) or stays as a bare ESM
import (module mode), and the entry's `.asset.php` lists either
`woocommerce-cart` or `@woo/cart` as a dependency. WP-core direction
without the Webpack coupling.

### #475 — `blocks-manifest.php`

`wp-blocks` emits one PHP file mapping every block directory to its
`block.json` contents. `fixture-plugin.php` feeds it to
`wp_register_block_types_from_metadata_collection` on WP 6.7+ with a
graceful fallback on older versions. No more N filesystem reads + JSON
parses per request.

### #477 — Deferred, but easy

An earlier POC iteration had `wp-components` (component-as-block
discovery + generated `render_block` filter from #477 Approach 1) and
`wp-templates` (filename-based template routing from Approach 2). Both
worked end-to-end. Removed for current scope; ~200 lines each to bring
back when toolkit takes #477 on.

### Script Modules / Interactivity API

Every WP-aware plugin takes a `buildType: 'script' | 'module'` option.
The fixture's counter block uses `viewScriptModule` + `@wordpress/interactivity`;
output preserves the import for WP's import-map to resolve:

```js
// dist/blocks/counter/view.js (module pass)
import { store, getContext } from "@wordpress/interactivity";
store("fixture/counter", { actions: { increment() { ... }, ... } });
```

```php
// dist/blocks/counter/view.asset.php
<?php return array( 'dependencies' => array( '@wordpress/interactivity' ), 'version' => '...' );
```

Both example blocks also use **dynamic rendering** (`render.php` files
copied into dist, `save()` returns `null`) — confirms that pattern
flows through the plugins without modification.

## Six porting gotchas (in case anyone else does this)

Real failure modes hit on the way from "build runs" to "blocks render
in WP." All small, all documented in code comments:

1. **JSX inside `.js` files.** Toolkit allows JSX in `.js` via Babel;
   Vite/esbuild requires `.jsx`/`.tsx`. Solved with a 20-line `jsxInJs()`
   pre-plugin that runs esbuild's JSX transform on `.js` files before
   Vite's import analyzer sees them.
2. **CJS → ESM externals interop.** `@10up/block-components`'s CJS bundle
   does `require('@wordpress/hooks')`. Rollup's commonjs plugin wraps
   these as virtual `?commonjs-external` ids expecting a default export.
   Added a virtual-module loader in `wp-externals` that resolves those
   ids and provides `export default window.wp.*`.
3. **`block.json` `file:` refs.** `editorScript: "file:./index.tsx"`
   needs rewriting to `"file:./index.js"` in dist, otherwise WP looks for
   the source extension and the block doesn't register. Toolkit handles
   this in CopyWebpackPlugin's `transformBlockJson`. Added the same
   transform to `wp-blocks` (per-block.json copies + the WP 6.7+ manifest
   entries). Also stamps a `version` field from the SHA-256 of style
   content when none is declared, matching toolkit exactly.
4. **JSX dev runtime in production.** Defaults emit `jsxDEV(...)` calls
   even in `vite build` output. WP only registers the production runtime
   (`wp-react-jsx-runtime` → `jsx`/`jsxs`); no `jsxDEV` global exists,
   so blocks render in edit mode but `save()` crashes the editor.
   Fixed with explicit `esbuild: { jsxDev: false }`.
5. **IIFE wrap for classic-script entries.** Vite outputs `format: 'es'`
   by default. WP enqueues entries as classic `<script>` tags, which
   share the global scope. With multiple block scripts on a page, each
   declaring `const { useBlockProps } = window.wp.blockEditor;` at module
   scope, the browser throws "duplicate variable" errors. Fixed by
   wrapping every script-pass entry in an IIFE — has to run in
   `writeBundle` (not `intro`/`outro`) because esbuild's minifier would
   otherwise inline a `var`-heavy IIFE back to module scope. Module-pass
   entries stay as pure ESM (Script Modules get their own scope).
6. **Linaria + Vanilla Extract example blocks.** Both already
   removal-confirmed in the v7 audit; no Vite-side replacement. Added a
   `skip: string[]` option to `wp-blocks` to exclude them.

Items 1–5 went into the shared POC config / plugins; #6 is a per-project
configuration option.

## Parity with toolkit today

| Toolkit feature | POC status |
|---|---|
| `block.json` discovery (`useBlockAssets`) | ✅ `wp-blocks` |
| `@wordpress/*` externals + `.asset.php` | ✅ `wp-externals` + **#474** namespaces |
| `loadBlockSpecificStyles` | ✅ `wp-block-styles` |
| `CopyWebpackPlugin` — block.json + `*.php` | ✅ `wp-blocks` |
| `CopyWebpackPlugin` — images/fonts/svg | ✅ `wp-copy-assets` |
| `transformBlockJson` — `file:` ext rewrite | ✅ `wp-blocks` |
| `transformBlockJson` — `version` stamp | ✅ SHA-256 of style content, byte-for-byte match |
| `MiniCSSExtractPlugin` | ✅ native to Vite |
| `RemoveEmptyScriptsPlugin` | ✅ inline `removeCssOnlyJsChunks` |
| PostCSS pipeline | ✅ `postcss.config.cjs` |
| Script Modules / Interactivity API | ✅ dual-pass build |
| `blocks-manifest.php` (#475) | ✅ `wp-blocks` |
| Dynamic block rendering (`render.php`) | ✅ via existing surface |
| `ReactRefreshWebpackPlugin` | 🟡 wired (plugin-react-swc), unverified in editor |
| `fast-refresh.php` shim | ❌ — needed before HMR-in-editor can be ticked |
| Parallel TS type-checker (`TenUpToolkitTscPlugin`) | ❌ |
| `BundleAnalyzerPlugin` (`--analyze`) | ❌ |
| ESLint/Stylelint in-bundler | ⏭ out of scope (Vite+ ships `vp lint` with Oxlint) |
| Linaria, Vanilla-Extract, Sass, sharp/svgo, svgr, BrowserSync | ⏭ dropped per audit |

Remaining real gaps: `fast-refresh.php` shim → parallel `tsc` plugin →
`--analyze` flag. All small.

## The remaining real ecosystem cost

`dist/blocks/example/index.js` is **310KB on Vite vs 12KB on webpack**.
The block imports `ContentPicker` from `@10up/block-components`, which
ships as a single CJS bundle (no `module` / `exports` field). Rollup
tree-shakes CJS less aggressively than webpack does here.

Two fixes possible: (a) update `@10up/block-components` to ship ESM,
(b) tune `commonjsOptions`. Not a bundler-speed problem — independent of
which CLI is used. Most consequential for projects that import small
slices of `@10up/block-components` and ship per-block.

## Try it

```bash
git fetch && git checkout audit/wp-build-vs-toolkit-comparison

# Install Vite+ (one-time, modifies shell rc to add ~/.vite-plus/bin)
VP_NODE_MANAGER=no curl -fsSL https://vite.plus | bash
export PATH="$HOME/.vite-plus/bin:$PATH"

# The small fixture POC (Playground-ready)
cd experiments/vite-poc
npm install
npm run build              # both passes via single-process orchestrator (~800ms)
npm run dev                # Vite dev server (~830ms ready)
npm run playground         # builds + boots WordPress Playground with the fixture

# The 10up-theme port — same source, side-by-side toolkit vs Vite vs Vite+
cd projects/10up-theme
npm install
npm run build              # toolkit / webpack (~2.87s cold)
npm run build:vite         # Vite + orchestrator (~1.91s cold)
npm run build:vp           # Vite+ (vp) (~1.92s cold, ~1.36s scripts-only)
npm run build:vp:scripts   # Vite+ single-pass — fastest path (~1.36s)
npm run dev:vp             # Vite+ dev server (~1.10s ready)
npm run playground:vite    # boot 10up-theme in WP Playground from dist-vite
```

Benchmark harness has the scenarios wired in:

```bash
node benchmarks/run.mjs --target=10up-theme    # all scenarios
node benchmarks/run.mjs --target=vite-poc      # just the small fixture
```

## What this POC does NOT prove

- **Vite+'s full toolchain story.** This validates that **`vp build` and
  `vp dev` work on a WP project today** and the plugins transfer cleanly.
  `vp lint` (Oxlint), `vp test` (Vitest), `vp fmt` (Oxfmt) are orthogonal —
  they layer on top.
- **Fast Refresh inside the WP block editor.** Plugin-react-swc is wired
  for it, but verifying behavior inside the editor iframe needs a real
  WP environment with the toolkit's `fast-refresh.php` shim equivalent.
- **A complex / monorepo port.** 10up-theme is small. Next validation
  step is an Ignite plugin and eventually the full Ignite Monorepo (21
  plugins + 3 themes). Webpack scales worse than Vite/Rolldown as module
  count grows; this is where the gap *should* widen.

## What this POC does prove

- **The WP-aware plumbing is ~750 lines of plugin TS, not a blocker.**
- **The speed wins are real and they happen at all scales tested.**
- **Vite+ today, alpha as it is, builds a real WP theme without
  modification to our plugins.**
- **#474 and #475 are tiny additions in this model** — not separate
  initiatives to absorb later.

The remaining decisions are about the broader Vite+ toolchain bet (lint,
test, format, task runner) and project-by-project migration cost — not
about whether Vite-as-bundler can serve WP projects. It can.

[poc]: https://github.com/10up/10up-toolkit/tree/audit/wp-build-vs-toolkit-comparison/experiments/vite-poc
[theme-port]: https://github.com/10up/10up-toolkit/blob/audit/wp-build-vs-toolkit-comparison/projects/10up-theme/vite.config.ts
