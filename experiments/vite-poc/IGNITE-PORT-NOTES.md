# ignite-wp-core Vite port — local-only setup

The port adds Vite + POC-plugin support to a plugin in a separate repo
(`~/Local Sites/ui-kit-monorepo/`). The changes live in that repo, not
in this toolkit branch — these notes capture what was added so the port
is reproducible.

## Bench results (M1 Max)

Real-source port of `plugins/ignite-wp-core` (15 source files, 4 script
+ 2 module entries, deps include `@10up/block-components`, `scroll-lock`,
`@wordpress/icons`, `@wordpress/interactivity`).

| Scenario | Toolkit (webpack) | Vite + POC | Δ |
|---|---:|---:|---:|
| cold-build (full dual-pass) | 2.46s | **843ms** | **-66%** |
| cold-build (scripts only) | 2.46s | **781ms** | **-68%** |
| warm-build (dual-pass) | 1.86s | **558ms** | **-70%** |
| dist size | 491 KB | **160 KB** | **-67%** |

Much bigger wins than 10up-theme (-33% there). The metadata-driven
externals correctly bundle *only* packages without `wpScript` /
`wpScriptModuleExports` (scroll-lock, @10up/block-components subpaths)
— webpack-toolkit bundles more aggressively + includes a longer
externals chain.

## Files added to `ignite-wp-core/`

1. **`vite.config.mts`** — Vite config that:
   - Sources WP-aware plugins from this toolkit's POC via absolute path:
     `/Users/fabiankaegy/Developer/10up/10up-toolkit/experiments/vite-poc/vite-plugins/index.ts`
   - Maps toolkit's `10up-toolkit.entry` / `moduleEntry` from
     `package.json` to Rollup's `input` map.
   - Filters dead entries (toolkit silently drops missing `admin.js`,
     `scroll-lock.js` — Vite errors out, so we filter).
   - Uses metadata-driven `wpExternals` with `projectRoot: pluginRoot`.
   - Bundles SWC's `parserConfig` + `jsxInJs` pre-transform for the
     plugin's `.js`-with-JSX files.

2. **`build.mjs`** — same orchestrator as POC: single-process dual-pass,
   parallel typecheck via vp, `--analyze` flag, `--no-typecheck` /
   `--strict-typecheck` toggles.

## Deps added to `ignite-wp-core/package.json`

Installed via `pnpm add --save-dev`:

```
vite                       ^6
@vitejs/plugin-react-swc   ^3.7
rollup-plugin-visualizer   ^7
```

`@wordpress/*` packages were already hoisted via pnpm's workspace — no
extra installs needed. `esbuild` ships with Vite. POC plugin code is
sourced over absolute path so no link/install required for it either.

## Reproduce

```bash
cd "~/Local Sites/ui-kit-monorepo/app/public/wp-content/plugins/ignite-wp-core"

# Toolkit's existing build (writes to dist/)
pnpm run build

# Vite + POC plugins (writes to dist-vite/)
node ./build.mjs
node ./build.mjs --analyze        # + dist-vite/stats.html
node ./build.mjs --mode=production # script pass only
```

The bench harness has the `cold-build-vite`, `cold-build-vite-scripts`,
and `warm-build-vite` scenarios wired into the `ignite-wp-core` target.

## Caveats

- `@wordpress/components` etc. mark themselves externalizable but
  toolkit's webpack-DEWP follows the internal import chain to surface
  *transitive* WP deps in `.asset.php` (e.g., `wp-primitives` from
  `@wordpress/components`). Our Vite path stops at the external and
  trusts WP's runtime dep resolution. Output asset.php has fewer
  entries than toolkit's — but the same enqueue order, because WP's
  `wp_register_script` already pulls in its own deps when registering
  `wp-components`. Verify in a real install before considering this
  fully correct.

- The `@10up/block-components` CJS-tree-shaking issue from earlier
  comments doesn't dominate here because `ignite-wp-core` imports
  specific subpaths (`@10up/block-components/api/...`,
  `@10up/block-components/hooks/...`) — Vite can tree-shake those
  cleanly.
