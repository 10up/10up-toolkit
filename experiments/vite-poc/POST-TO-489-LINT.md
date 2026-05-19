## Vite+ unified toolchain: lint / fmt / test results

Following up on the [bundler-focused comment above](https://github.com/10up/10up-toolkit/issues/489#issuecomment-4482576761). Plugins worked through `vp build`; this comment is about the rest of the `vp` toolchain — **lint, format, test** — to address whether Vite+ replaces our current ESLint / Stylelint / Prettier / Jest story.

All numbers on the same machine (M1 Max), same source tree (`projects/10up-theme`).

## Headline numbers

**10up-theme — full lint comparison** (vp + standalone Stylelint vs toolkit's wrappers):

| Scenario | Toolkit (current) | Vite+ world | Δ |
|---|---:|---:|---:|
| JS lint | 2.07s (ESLint via `lint-js`) | **729ms** (`vp lint` / Oxlint) | **-65%** |
| CSS lint | 1.04s (Stylelint v15 via `lint-style`) | **781ms** (Stylelint v17 standalone) | **-25%** |
| **Combined lint (JS + CSS)** | **3.11s** | **1.51s** | **-51%** |
| JS format check | — | 935ms (`vp fmt --check` / Oxfmt) | new capability |

**POC fixture — full toolchain:**

| Scenario | Time | What it ran |
|---|---:|---|
| `vp lint` | 734ms | Oxlint, 11 TS/TSX files, 95 rules |
| `vp lint --type-aware` | ~390ms wall-clock | 11 files, 110 rules (adds type-checked rules) |
| `vp fmt --check` | 874ms | Oxfmt, 20 files |
| `vp test run` | 992ms | Vitest, 2 tests |

Internal Oxlint time on 10up-theme: **162ms for 26 files**. Most of the
729ms wall-clock is `npm` + `vp` bootstrap + Node startup. The actual
linting is sub-200ms.

## What `vp` covers vs what toolkit ships today

| Tool | Toolkit today | Vite+ world | Notes |
|---|---|---|---|
| JS/TS lint | ESLint (`@10up/eslint-config`) | ✅ Oxlint via `vp lint` | Oxc-based, Rust |
| CSS lint | Stylelint v15 (`@10up/stylelint-config`) | ✅ Stylelint v17 standalone | `vp` doesn't bundle it; runs alongside |
| Format | Prettier (via ESLint integration) | ✅ Oxfmt via `vp fmt` | Rust; opinionated |
| Unit tests | Jest (`test-unit-jest` — broken per #480) | ✅ Vitest via `vp test` | Vite-native, ESM-first |
| Type check | parallel `tsc` (`TenUpToolkitTscPlugin`) | ✅ `vp check` (combines fmt+lint+typecheck) | |

**Stylelint v17 caveat.** The current `@10up/stylelint-config` (v3.0.1) pins
`stylelint@^15` and uses `stylelint-stylistic` (whose latest 0.4.5 still
peers stylelint 15). Bumping the toolkit's stylelint to v17 means either
(a) dropping `stylelint-stylistic` (loses a couple of formatting rules
that Oxfmt now covers anyway) or (b) waiting for that plugin to be
updated. The POC's config drops it and extends `stylelint-config-recommended@18`
directly. Rules used in the bench match the 10up baseline minus the
stylistic ones.

## Setting it up

Three small things had to land for `vp lint` / `vp test` to work on the POC's existing `vite.config.ts`:

1. **`import.meta.dirname` instead of `__dirname`.** `vp` loads `vite.config.ts` as pure ESM (no CJS shims), and that's where `__dirname` only exists. One-line fix per config.
2. **Explicit `.ts` extensions on internal imports.** `vite.config.ts`'s `import { … } from './vite-plugins'` had to become `'./vite-plugins/index.ts'` — `vp`'s Node ESM loader is strict about extensions where Vite's bundler-time resolver isn't. About 6 import sites changed total.
3. **Separate `vitest.config.ts`** for tests. The Vite config sets `root: fixture-plugin/` which scopes Vitest to the fixture; tests live under `vite-plugins/`. Five lines:
   ```ts
   import { defineConfig } from 'vite';
   export default defineConfig({
     test: { root: import.meta.dirname, include: ['vite-plugins/**/*.test.ts'] },
   });
   ```

`vp test run` then picks up `*.test.ts` files anywhere in the configured roots. Two trivial unit tests against `wp-blocks` discovery + skip behavior pass in 992ms wall-clock / 215ms Vitest-internal.

One inconsistency worth flagging: **`vp lint` doesn't recursively discover files from a directory argument** — `vp lint vite-plugins/` finds 0 files. You have to pass file paths explicitly (`vp lint $(find … )`). `vp fmt vite-plugins/` works the way you'd expect. Documented this in the POC's npm script.

## What this means for the option E decision

The earlier comment had `vp lint` / `vp test` listed as "out of scope, layer on top." This pass moved them in-scope and measured:

- **JS lint goes from 2.07s to 0.73s (-65%).** That's the same gap-direction as the bundler numbers.
- **CSS lint stays on Stylelint, bumped from v15 to v17, runs separately: 1.04s → 0.78s (-25%).**
- **Combined lint (JS + CSS) goes from 3.11s to 1.51s (-51%).**
- **Vitest replaces a broken Jest setup.** Per [#480](https://github.com/10up/10up-toolkit/issues/480), `test-unit-jest` doesn't work out of the box anyway — so the move costs us nothing on the test side, and arguably fixes #480 by replacing the toolchain entirely.
- **Format checking is a new capability.** Toolkit relies on Prettier via ESLint integration today; running it standalone is awkward. `vp fmt --check` is a clean separate pass.
- **CSS lint is not unified under `vp` but isn't a regression** — it's `npm run lint:style` instead of `vp lint --css` (which doesn't exist). The slowdown vs the JS gain is small.
- **One-time porting cost is small** — `import.meta.dirname` + explicit `.ts` extensions + a `vitest.config.ts` + a `.stylelintrc.json`. Same shape as the bundler-side gotchas: a handful of small fixes, all documented in the POC.

## Updated decision-matrix row

| Goal | E: Vite/Vite+ + plugins (updated) |
|---|---|
| 1. Faster builds | ✅ **-33% cold, -57% dev-start** (bundling) |
| 2. DX (block.json, HMR, lint/test) | ✅ block.json + Fast Refresh; **lint -65%, test replaces broken Jest, fmt new capability** |
| 3. Easy migration | 🟡 different config model; six bundler gotchas + three small lint/test gotchas — all documented |
| 4. Lower maintenance | 🟡 ~750 lines of plugin TS to maintain; **`vp` provides lint/fmt/test out of the box (no in-house configs)** |

The "lint/test/format orthogonal" caveat from the earlier comment now has measured numbers behind it. The remaining shortcut comparison is the Ignite-monorepo port, where webpack should scale worst and Vite+/Rolldown should widen the gap further.
