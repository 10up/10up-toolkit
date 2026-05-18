# vite-poc

Proof of concept: can we replace 10up-toolkit's WordPress-specific webpack
plumbing with a small set of Vite plugins, with [Vite+](https://viteplus.dev)
as the eventual toolchain harness?

Answers the "Option E" question raised on
[#489](https://github.com/10up/10up-toolkit/issues/489). The scope is
deliberately constrained to **parity with what toolkit ships today** plus
the two open enhancement issues that align with toolkit's existing surface
(#474, #475) and the Script Modules / Interactivity API support — to make
the comparison apples-to-apples. The bigger ideas in #477 (component-as-block,
filename-based template routing) drop out cleanly as the same plugin
pattern, but are out of scope here.

## Status

| Feature                                              | Status | Tracking |
| ---------------------------------------------------- | ------ | -------- |
| `block.json` discovery → multi-entry                 | ✅ |          |
| `@wordpress/*` → `wp.*` globals + `.asset.php`       | ✅ |          |
| **Namespace-driven externals** (`woo`, `acme`, …)    | ✅ | [#474](https://github.com/10up/10up-toolkit/issues/474) |
| **`blocks-manifest.php` emission** (WP 6.7+ API)     | ✅ | [#475](https://github.com/10up/10up-toolkit/issues/475) |
| **Script Modules (Interactivity API)** via dual pass | ✅ |          |
| **PostCSS pipeline** (postcss-import, mixins, preset-env, cssnano) | ✅ |  |
| React/jsx-runtime externalized — no 40KB-per-block tax | ✅ |          |
| Per-block CSS auto-enqueue (`loadBlockSpecificStyles`) | ✅ |          |
| HMR / Fast Refresh in the block editor               | 🟡 wired, needs real WP to verify |          |
| Fixture plugin exercising the above                  | ✅ |          |
| TypeScript via esbuild                               | ✅ native to Vite |          |
| `component.json` discovery + `render_block` enqueue  | ⏭ deferred | [#477](https://github.com/10up/10up-toolkit/issues/477) Approach 1 |
| Filename-based template routing                      | ⏭ deferred | [#477](https://github.com/10up/10up-toolkit/issues/477) Approach 2 |

**On the deferred items:** earlier POC iterations included working
`wp-components` and `wp-templates` plugins that handled both approaches
in #477. They were removed to keep the scope aligned with toolkit's
current surface for the bundler comparison. The pattern is the same as
`wp-blocks` (discovery → entries + generated PHP manifest), so adding
either is straightforward when toolkit decides to take #477 on.

## Layout

```
vite-poc/
├── vite.config.ts            # Mode-aware: --mode modules switches to Script Modules pass
├── postcss.config.cjs        # Toolkit's PostCSS pipeline minus deprecated bits
├── package.json
├── vite-plugins/             # The WordPress-specific bits
│   ├── wp-blocks.ts          # block.json discovery + blocks-manifest.php (#475)
│   ├── wp-externals.ts       # Namespace-driven externals + .asset.php (#474) — script + module modes
│   ├── wp-block-styles.ts    # Per-block CSS auto-enqueue
│   └── index.ts
└── fixture-plugin/           # Minimal WP plugin to consume the plugins
    ├── fixture-plugin.php
    ├── admin/index.ts        # non-block entry
    ├── blocks/
    │   ├── hello/            # editorScript + viewScriptModule + style + editorStyle
    │   │                     #   ← exercises Interactivity API (module mode view)
    │   └── counter/          # editorScript + style
    └── assets/css/
        ├── globals/colors.css    # postcss-global-data: tokens available everywhere
        ├── mixins/visually-hidden.css  # postcss-mixins
        └── blocks/legacy-block/index.css  # per-block CSS routing
```

## Running it

```bash
cd experiments/vite-poc
npm install
npm run build      # runs build:scripts AND build:modules sequentially
npm run dev        # dev server (script mode)
```

Sub-scripts:

```bash
npm run build:scripts   # vite build              (classic <script> registration)
npm run build:modules   # vite build --mode modules (Script Modules registration)
```

Vite+ (once installed via `curl -fsSL https://vite.plus | bash`):

```bash
vp build   # equivalent to vite build (single mode)
vp dev
```

## What the build produces

Single `dist/` from two passes; the script pass clears the dir, the module
pass is additive.

```
fixture-plugin/dist/
├── admin/index.{js,asset.php}                 # script pass — non-block entry
├── blocks-manifest.php                        # ← #475
├── blocks/
│   ├── hello/
│   │   ├── block.json                         # copied for register_block_type
│   │   ├── index.{js,asset.php}               # script pass (editorScript)
│   │   │   ↓ const { registerBlockType } = window.wp.blocks;
│   │   │   ↓ deps: ['react-jsx-runtime', 'wp-block-editor', 'wp-blocks', 'wp-element', 'wp-i18n']
│   │   ├── view.{js,asset.php}                # module pass (viewScriptModule)
│   │   │   ↓ import { store } from "@wordpress/interactivity";
│   │   │   ↓ deps: ['@wordpress/interactivity']
│   │   ├── style.css
│   │   └── editor.css
│   └── counter/{block.json, index.js, index.asset.php, style.css}
└── autoenqueue/legacy-block/index.css         # per-block CSS routing
```

Each `*.asset.php` is the same shape toolkit emits today, with deps in the
format the corresponding registration call expects:

```php
// Script mode — handles for wp_register_script
<?php return array( 'dependencies' => array( 'wp-blocks', 'wp-element' ), 'version' => '...' );

// Module mode — module specifiers for wp_register_script_module
<?php return array( 'dependencies' => array( '@wordpress/interactivity' ), 'version' => '...' );
```

## How the referenced issues land in the POC

### #474 — Namespace-driven externalization

`wp-externals` no longer hardcodes `@wordpress/`. It takes an
`externalNamespaces` map:

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
`woocommerce-cart` or `@woo/cart` as a dependency depending on mode.

This is the WP-core direction for externalization without the Webpack
coupling.

### #475 — `blocks-manifest.php`

`wp-blocks` emits one PHP file mapping every block directory to its
`block.json` contents:

```php
return array(
  'hello'   => array( 'apiVersion' => 3, 'name' => 'fixture/hello', ... ),
  'counter' => array( 'apiVersion' => 3, 'name' => 'fixture/counter', ... ),
);
```

`fixture-plugin.php` feeds it to `wp_register_block_types_from_metadata_collection`
on WP 6.7+ with a graceful fallback on older versions. No more N
filesystem reads + JSON parses per request.

### #477 — Deferred but easy

Both proposals (component-as-block and filename-based template routing)
follow the same shape as `wp-blocks` — scan a directory, expand `file:`
refs into Rollup entries, emit a PHP manifest that wires registration. The
earlier POC iteration had both working end-to-end; they were removed for
parity-with-current-toolkit scope. Re-adding either is a copy of
`wp-blocks` plus the conditional-enqueue PHP logic from the issue —
maybe ~200 lines per plugin.

### Script Modules (Interactivity API)

Every WP-aware plugin takes a `buildType: 'script' | 'module'` option. The
`vite.config.ts` switches all plugins based on `--mode modules`:

- **Script pass** rewrites `@wordpress/*` imports into `window.wp.*` reads;
  emits `.asset.php` with `wp-*` script handles for `wp_register_script`.
- **Module pass** leaves ESM imports verbatim (resolved at runtime by WP's
  import map); emits `.asset.php` with raw module specifiers for
  `wp_register_script_module`.

The two passes write to the same `dist/`.

### PostCSS (not Sass)

`postcss.config.cjs` matches toolkit's current pipeline minus the
deprecated `editor-styles-wrapper`:

1. `postcss-import` — `@import` resolution at build time
2. `@csstools/postcss-global-data` — globals available without per-file `@import`
3. `postcss-mixins` — `@define-mixin` / `@mixin` from `assets/css/mixins/`
4. `postcss-preset-env` (stage 0) — native CSS nesting, color functions, etc.
5. `cssnano` — production-only minify

## Running in WordPress (Playground)

The fixture plugin ships with a `blueprint.json` so reviewers can boot
the build in a real WordPress install (in-browser, via WASM PHP) without
any local setup:

```bash
npm run build && npm run playground
```

That runs `@wp-playground/cli@latest server` with the fixture mounted as
a plugin, the blueprint applied (activates the plugin, creates a sample
page that uses both `fixture/hello` and `fixture/counter`), and
auto-login enabled. Opens at `http://127.0.0.1:9400`.

Requires Node 20+ for `@wp-playground/cli` (`@php-wasm/cli-util` engine
requirement).

## What this POC does NOT prove

- **Vite+'s own value-add.** This POC validates that the *plugins* work
  inside Vite. Vite+'s task runner, monorepo features, and unified
  lint/test/format are orthogonal — they layer on top.
- **Stylelint / ESLint integration.** Toolkit runs these in-bundler today.
  In a Vite+ world they'd live separately (Oxlint via `vp lint`).
- **`block.json` version stamping.** Toolkit's `transformBlockJson`
  also rewrites the `version` field to the build hash; the POC's copy
  rewrites the `file:` extensions (`.tsx` → `.js`, `.scss` → `.css`)
  but not the version field. Easy to add.
- **Fast Refresh in the actual WP block editor.** The plugin is configured
  for Fast Refresh, but verifying it works inside the editor iframe needs
  a real WP environment.
- **Reading `wpScript` metadata from `@wordpress/*` packages.** #474
  mentions this as a smarter mode that requires installing every WP
  package. The POC implements the config-driven half; the metadata-driven
  half is a follow-up.
- **CopyWebpackPlugin equivalent.** Toolkit copies `assets/{images,fonts,svg}`
  into `dist/` via CopyWebpackPlugin. The POC doesn't yet. Easy to add.
