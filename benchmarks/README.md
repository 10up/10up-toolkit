# Benchmarks

Baseline measurements for 10up-toolkit performance work (7.0 vision: rspack +
Biome + trim, per the audit). Captures **before** numbers so future engine
swaps can be measured concretely.

Results live in `results/<timestamp>-<sha>/` (gitignored). Scripts and target
definitions are committed.

## What's measured

Per target, some subset of these scenarios:

| Scenario | What it measures |
|---|---|
| `cold-build` | `rm -rf dist node_modules/.cache` → `build` → wall time + dist size |
| `warm-build` | Re-run `build` over an existing dist/cache |
| `dev-start` | `rm -rf dist` → spawn dev/watch → time until first "compiled" marker |
| `lint-js` / `lint-style` / `lint` | Single-shot lint run |

Each scenario runs N times (configured per target). Reports report median, min, max.

## Targets

- `10up-theme` — small WP theme (toolkit's built-in sample project)
- `library` — CJS+UMD component lib (non-WP build path)
- `library-ts` — TS lib emitting MJS+CJS
- `ignite-wp-core` — single complex workspace inside the Ignite Monorepo
- `ignite-monorepo` — full `pnpm exec turbo run build` across 21 plugins + 3 themes

Paths and commands live in [`targets.mjs`](./targets.mjs). The Ignite Monorepo
path is hardcoded to `~/Local Sites/ui-kit-monorepo/app/public/wp-content/` —
adjust there if the local setup differs.

## Running

```bash
node benchmarks/run.mjs                    # everything
node benchmarks/run.mjs --target=10up-theme
node benchmarks/run.mjs --scenario=cold-build
node benchmarks/run.mjs --target=ignite-monorepo --scenario=warm-build
node benchmarks/run.mjs --dry-run          # print plan only
```

Full baseline runtime: roughly 20–40 minutes depending on machine, dominated
by Ignite Monorepo cold builds.

## Interpreting results

Each run writes:

- `raw.json` — full structured data (env, per-run samples, dist sizes)
- `report.md` — human-readable summary table

To compare before/after, diff two `report.md` files, or read both `raw.json`s
into a script.

## Notes / caveats

- Wall-clock only. No CPU/RSS — macOS's `/usr/bin/time` doesn't expose them
  the way GNU time does, and we'd rather keep the harness portable than add
  a `coreutils` install step.
- "Cold" means the build's own caches are wiped (`dist/`, `node_modules/.cache/`,
  Turbo's `--force`). OS-level file cache is **not** cleared — between runs
  the FS is warm. Fine for relative comparisons; not a fair number for
  cold-disk numbers.
- `dev-start` kills the process once the ready regex matches. The regex is
  permissive (`compiled successfully`, `webpack X.Y.Z compiled`, `DONE`) so
  it catches both wp-scripts/webpack default output and toolkit's loggers.
  If a future engine prints something else, update `READY_PATTERN` in
  `targets.mjs`.
- `lint-*` scenarios use `allowNonZeroExit: true` — we time the run even if
  the linter reports findings, since the goal is throughput, not correctness.
- **Caveats observed in the first baseline run:**
  - ESLint persists `.eslintcache` between runs; first `lint-js` run can be
    20–30% slower than subsequent ones. Median dampens this.
  - For pnpm-managed targets (`ignite-wp-core`, `ignite-monorepo`), the first
    run after a clone or `node_modules` change is slower than steady-state
    because pnpm's virtual store needs to be traversed. The harness's `setup`
    step (`rm -rf node_modules/.cache`) doesn't reach the pnpm store. This is
    OK for before/after comparison provided both runs start from the same
    machine state.
  - Webpack's persistent cache, if toolkit ever enables it, may live outside
    `node_modules/.cache/` — if cold-build numbers ever look unrealistically
    fast on run 1, audit the toolkit config and extend the per-scenario
    `setup` array.
- **Reproducibility:** results capture Node/npm/pnpm versions, git SHA, CPU,
  RAM, OS in `raw.json`. Always compare runs from the same machine — these
  numbers are not portable across hardware.
