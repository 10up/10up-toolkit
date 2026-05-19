/**
 * Single-process dual-pass build with parallel TypeScript type-check.
 *
 * `vite build && vite build --mode modules` runs two separate `node` +
 * Vite-init cycles back-to-back, each paying ~500–800ms before doing any
 * real work. Driving both passes through Vite's programmatic build API
 * in one process eliminates that fixed cost.
 *
 * The type-check spawns at the same time as the script pass and runs
 * concurrently — same role as toolkit's `TenUpToolkitTscPlugin` but on
 * tsgolint (TypeScript Go) via vp instead of node-tsc. Type errors are
 * surfaced but do not fail the build by default, matching toolkit.
 * Pass `--strict-typecheck` to fail the build on type errors.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { build } from 'vite';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const onlyMode = args.find((a) => a.startsWith('--mode='))?.slice('--mode='.length);
const strictTypecheck = args.includes('--strict-typecheck');
const skipTypecheck = args.includes('--no-typecheck');

const passes = onlyMode ? [onlyMode] : ['production', 'modules'];

/**
 * Spawn `vp lint --type-aware --type-check` against the project's TS source.
 * Resolved via the vp shipped at `~/.vite-plus/bin/vp` (the install script
 * puts it on PATH via shell rc).
 *
 * Returns a promise that resolves with `{ exitCode, elapsedMs }`. The build
 * doesn't await this until after the bundling is done — letting it run on
 * a separate process pinned to a second CPU core.
 */
function startTypecheck() {
	if (skipTypecheck) return null;
	const tsconfig = join(here, 'tsconfig.json');
	if (!existsSync(tsconfig)) return null;

	const start = performance.now();
	// File set has to match what `npm run typecheck:vp` uses — vp's
	// type-check resolver wants explicit file paths (it doesn't recurse
	// from a directory). Sourced from the same dirs the bundler reads.
	const child = spawn(
		'bash',
		[
			'-c',
			`vp lint --type-aware --type-check --tsconfig ${tsconfig} $(find vite-plugins fixture-plugin -type f \\( -name '*.ts' -o -name '*.tsx' \\) -not -path '*/node_modules/*' -not -path '*/dist/*')`,
		],
		{ cwd: here, stdio: ['ignore', 'pipe', 'pipe'] },
	);
	let output = '';
	child.stdout.on('data', (d) => (output += d));
	child.stderr.on('data', (d) => (output += d));

	return new Promise((res) => {
		child.on('close', (exitCode) => {
			res({ exitCode: exitCode ?? 1, elapsedMs: performance.now() - start, output });
		});
		child.on('error', () => {
			// `vp` not on PATH — silently skip rather than fail the build.
			res({ exitCode: 0, elapsedMs: performance.now() - start, output: '(vp not found; typecheck skipped)' });
		});
	});
}

const overall = performance.now();
const typecheckPromise = startTypecheck();

for (const mode of passes) {
	const start = performance.now();
	// Passes are intentionally sequential: the script pass clears dist
	// (emptyOutDir), the module pass adds to it.
	// eslint-disable-next-line no-await-in-loop
	await build({ mode, logLevel: 'info' });
	const elapsed = performance.now() - start;
	console.log(`✓ ${mode} pass: ${(elapsed / 1000).toFixed(2)}s`);
}

if (typecheckPromise) {
	const tc = await typecheckPromise;
	const tcSecs = (tc.elapsedMs / 1000).toFixed(2);
	if (tc.exitCode === 0) {
		console.log(`✓ typecheck: ${tcSecs}s`);
	} else {
		console.log(`\n⚠ typecheck: ${tcSecs}s (errors below)\n${tc.output}`);
		if (strictTypecheck) {
			console.error('Build failed: type errors with --strict-typecheck.');
			process.exit(tc.exitCode);
		}
	}
}

const total = performance.now() - overall;
console.log(`✓ total: ${(total / 1000).toFixed(2)}s`);
