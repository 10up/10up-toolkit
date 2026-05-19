// Benchmark target definitions for 10up-toolkit 7.0 baseline work.
//
// Each target lists the scenarios that make sense for it. A scenario is a
// (kind + command + setup) bundle that the runner can execute.
//
// kinds:
//   - "timed":     run command N times, measure wall-clock. Optionally record
//                  dist size after the last run.
//   - "dev-start": spawn command, watch stdout for readyPattern, record time
//                  from spawn to first match, then kill.

import { homedir } from 'node:os';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const TOOLKIT_ROOT = resolve(HERE, '..');
const IGNITE_ROOT = resolve(homedir(), 'Local Sites/ui-kit-monorepo/app/public/wp-content');

const READY_PATTERN = /compiled (?:successfully|with)|webpack \d+\.\d+\.\d+ compiled|^DONE/im;
const VITE_READY_PATTERN = /ready in \d+|VITE\+? v\d+\.\d+\.\d+|Local:\s*http/i;

export const targets = [
	{
		id: '10up-theme',
		name: '10up-toolkit / projects/10up-theme (small WP theme)',
		cwd: `${TOOLKIT_ROOT}/projects/10up-theme`,
		pm: 'npm',
		scenarios: [
			{
				id: 'cold-build',
				kind: 'timed',
				runs: 3,
				setup: ['rm -rf dist', 'rm -rf node_modules/.cache'],
				command: 'npm run build',
				distPath: 'dist',
			},
			{
				id: 'warm-build',
				kind: 'timed',
				runs: 3,
				priming: 'npm run build',
				command: 'npm run build',
			},
			{
				id: 'dev-start',
				kind: 'dev-start',
				runs: 2,
				setup: ['rm -rf dist', 'rm -rf node_modules/.cache'],
				command: 'npm run watch',
				readyPattern: READY_PATTERN,
			},
			{
				id: 'lint-js',
				kind: 'timed',
				runs: 3,
				command: 'npm run lint-js',
				allowNonZeroExit: true,
			},
			{
				id: 'lint-style',
				kind: 'timed',
				runs: 3,
				command: 'npm run lint-style',
				allowNonZeroExit: true,
			},
			// ── Vite port of the same source tree (POC plugins) ──
			// Same source, different bundler — direct A/B comparison vs toolkit.
			{
				id: 'cold-build-vite',
				kind: 'timed',
				runs: 3,
				setup: ['rm -rf dist-vite', 'rm -rf node_modules/.vite'],
				command: 'npm run build:vite',
				distPath: 'dist-vite',
			},
			{
				id: 'cold-build-vite-scripts',
				kind: 'timed',
				runs: 3,
				setup: ['rm -rf dist-vite', 'rm -rf node_modules/.vite'],
				command: 'npm run build:vite:scripts',
				distPath: 'dist-vite',
			},
			{
				id: 'warm-build-vite',
				kind: 'timed',
				runs: 3,
				priming: 'npm run build:vite',
				command: 'npm run build:vite',
			},
			{
				id: 'dev-start-vite',
				kind: 'dev-start',
				runs: 2,
				setup: ['rm -rf dist-vite', 'rm -rf node_modules/.vite'],
				command: 'npm run dev:vite',
				readyPattern: VITE_READY_PATTERN,
			},
			// ── Vite+ (vp CLI) on the same source + same plugins ──
			// Tests the actual Vite+ unified-toolchain story end-to-end. The
			// vp binary lives at ~/.vite-plus/bin/vp; the harness inherits
			// CHILD_PATH which the runner extends with the modern Node bin.
			// vp itself adds its own bin to PATH via shell rc.
			{
				id: 'cold-build-vp',
				kind: 'timed',
				runs: 3,
				setup: ['rm -rf dist-vite', 'rm -rf node_modules/.vite'],
				command: 'npm run build:vp',
				distPath: 'dist-vite',
			},
			{
				id: 'cold-build-vp-scripts',
				kind: 'timed',
				runs: 3,
				setup: ['rm -rf dist-vite', 'rm -rf node_modules/.vite'],
				command: 'npm run build:vp:scripts',
				distPath: 'dist-vite',
			},
			{
				id: 'warm-build-vp',
				kind: 'timed',
				runs: 3,
				priming: 'npm run build:vp',
				command: 'npm run build:vp',
			},
			{
				id: 'dev-start-vp',
				kind: 'dev-start',
				runs: 2,
				setup: ['rm -rf dist-vite', 'rm -rf node_modules/.vite'],
				command: 'npm run dev:vp',
				readyPattern: VITE_READY_PATTERN,
			},
			// vp lint (Oxlint, Rust) vs toolkit lint-js (ESLint, JS)
			{
				id: 'lint-vp',
				kind: 'timed',
				runs: 3,
				command: 'npm run lint:vp',
				allowNonZeroExit: true,
			},
			// vp fmt --check (Oxfmt, Rust) — no toolkit equivalent in baseline.
			// Closest comparison is toolkit's prettier via lint-js, but that's
			// bundled. Standalone measurement.
			{
				id: 'fmt-check-vp',
				kind: 'timed',
				runs: 3,
				command: 'npm run fmt:vp',
				allowNonZeroExit: true,
			},
			// Stylelint v17 standalone (the "Vite+ world" CSS-lint path — vp
			// doesn't bundle CSS lint, so Stylelint runs separately). Compared
			// against toolkit's `lint-style` (bundled Stylelint v15).
			{
				id: 'lint-style-v17',
				kind: 'timed',
				runs: 3,
				command: 'npm run lint:style:v17',
				allowNonZeroExit: true,
			},
		],
	},
	{
		id: 'library',
		name: '10up-toolkit / projects/library (CJS+UMD component lib)',
		cwd: `${TOOLKIT_ROOT}/projects/library`,
		pm: 'npm',
		scenarios: [
			{
				id: 'cold-build',
				kind: 'timed',
				runs: 3,
				setup: ['rm -rf dist', 'rm -rf node_modules/.cache'],
				command: 'npm run build',
				distPath: 'dist',
			},
			{
				id: 'warm-build',
				kind: 'timed',
				runs: 3,
				priming: 'npm run build',
				command: 'npm run build',
			},
			{
				id: 'lint',
				kind: 'timed',
				runs: 3,
				command: 'npm run lint',
				allowNonZeroExit: true,
			},
		],
	},
	{
		id: 'library-ts',
		name: '10up-toolkit / projects/library-ts (TS lib, MJS+CJS)',
		cwd: `${TOOLKIT_ROOT}/projects/library-ts`,
		pm: 'npm',
		scenarios: [
			{
				id: 'cold-build',
				kind: 'timed',
				runs: 3,
				setup: ['rm -rf dist', 'rm -rf node_modules/.cache'],
				command: 'npm run build',
				distPath: 'dist',
			},
			{
				id: 'warm-build',
				kind: 'timed',
				runs: 3,
				priming: 'npm run build',
				command: 'npm run build',
			},
		],
	},
	{
		id: 'vite-poc',
		name: 'experiments/vite-poc (Vite + WP plugins POC)',
		cwd: `${TOOLKIT_ROOT}/experiments/vite-poc`,
		pm: 'npm',
		scenarios: [
			{
				id: 'cold-build',
				kind: 'timed',
				runs: 3,
				// `dist` lives inside fixture-plugin/ for this target.
				setup: ['rm -rf fixture-plugin/dist', 'rm -rf node_modules/.cache', 'rm -rf node_modules/.vite'],
				command: 'npm run build',
				distPath: 'fixture-plugin/dist',
			},
			{
				id: 'cold-build-scripts-only',
				kind: 'timed',
				runs: 3,
				// Compare to 10up-theme apples-to-apples — toolkit doesn't have a
				// separate Script Modules pass, so the script pass alone is the
				// closest equivalent.
				setup: ['rm -rf fixture-plugin/dist', 'rm -rf node_modules/.cache', 'rm -rf node_modules/.vite'],
				command: 'npm run build:scripts',
				distPath: 'fixture-plugin/dist',
			},
			{
				id: 'warm-build',
				kind: 'timed',
				runs: 3,
				priming: 'npm run build',
				command: 'npm run build',
			},
			{
				id: 'dev-start',
				kind: 'dev-start',
				runs: 2,
				setup: ['rm -rf fixture-plugin/dist', 'rm -rf node_modules/.vite'],
				command: 'npm run dev',
				readyPattern: VITE_READY_PATTERN,
			},
			// Vite+ unified toolchain: lint (Oxlint), fmt (Oxfmt), test (Vitest)
			{
				id: 'lint-vp',
				kind: 'timed',
				runs: 3,
				command: 'npm run lint:vp',
				allowNonZeroExit: true,
			},
			{
				id: 'fmt-check-vp',
				kind: 'timed',
				runs: 3,
				command: 'npm run fmt:vp',
				allowNonZeroExit: true,
			},
			{
				id: 'test-vp',
				kind: 'timed',
				runs: 3,
				command: 'npm run test:vp',
				allowNonZeroExit: true,
			},
			// Stylelint v17 standalone (CSS lint — vp doesn't include).
			{
				id: 'lint-style',
				kind: 'timed',
				runs: 3,
				command: 'npm run lint:style',
				allowNonZeroExit: true,
			},
		],
	},
	{
		id: 'ignite-wp-core',
		name: 'Ignite Monorepo / plugins/ignite-wp-core (single workspace)',
		cwd: `${IGNITE_ROOT}/plugins/ignite-wp-core`,
		pm: 'pnpm',
		scenarios: [
			{
				id: 'cold-build',
				kind: 'timed',
				runs: 3,
				setup: ['rm -rf dist', 'rm -rf node_modules/.cache'],
				command: 'pnpm run build',
				distPath: 'dist',
			},
			{
				id: 'warm-build',
				kind: 'timed',
				runs: 3,
				priming: 'pnpm run build',
				command: 'pnpm run build',
			},
			{
				id: 'dev-start',
				kind: 'dev-start',
				runs: 2,
				setup: ['rm -rf dist', 'rm -rf node_modules/.cache'],
				command: 'pnpm run watch',
				readyPattern: READY_PATTERN,
			},
		],
	},
	{
		id: 'ignite-monorepo',
		name: 'Ignite Monorepo (turbo run build, full monorepo)',
		cwd: IGNITE_ROOT,
		pm: 'pnpm',
		scenarios: [
			{
				id: 'cold-build',
				kind: 'timed',
				runs: 2,
				setup: ['pnpm run clean-dist'],
				// --force bypasses turbo's task cache, forcing every workspace to rebuild.
				command: 'pnpm exec turbo run build --force',
				distPath: null, // multiple dist dirs across workspaces; size measured below
				measureGlobDistSize: ['plugins/ignite-wp-*/dist', 'themes/ignite-wp-*/dist'],
			},
			{
				id: 'warm-build',
				kind: 'timed',
				runs: 3,
				priming: 'pnpm exec turbo run build --force',
				// Without --force, turbo serves from cache wherever possible.
				command: 'pnpm exec turbo run build',
			},
			{
				id: 'lint-js',
				kind: 'timed',
				runs: 2,
				command: 'pnpm run lint-js',
				allowNonZeroExit: true,
			},
			{
				id: 'lint-style',
				kind: 'timed',
				runs: 2,
				command: 'pnpm run lint-style',
				allowNonZeroExit: true,
			},
		],
	},
];
