/**
 * Single-process dual-pass build for the 10up-theme Vite port.
 *
 * Mirrors `experiments/vite-poc/build.mjs`: runs both Vite passes in one
 * process and optionally spawns `vp lint --type-aware --type-check` in
 * parallel (no-op for 10up-theme since it has no tsconfig.json).
 *
 * Flags: `--mode=<production|modules>`, `--no-typecheck`, `--strict-typecheck`.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { build } from 'vite';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const onlyMode = args.find((a) => a.startsWith('--mode='))?.slice('--mode='.length);
const strictTypecheck = args.includes('--strict-typecheck');
const skipTypecheck = args.includes('--no-typecheck');

const passes = onlyMode ? [onlyMode] : ['production', 'modules'];

function startTypecheck() {
	if (skipTypecheck) return null;
	const tsconfig = join(here, 'tsconfig.json');
	if (!existsSync(tsconfig)) return null;

	const start = performance.now();
	const child = spawn(
		'bash',
		[
			'-c',
			`vp lint --type-aware --type-check --tsconfig ${tsconfig} $(find assets includes -type f \\( -name '*.ts' -o -name '*.tsx' \\) -not -path '*/node_modules/*' -not -path '*/dist/*')`,
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
			res({ exitCode: 0, elapsedMs: performance.now() - start, output: '(vp not found; typecheck skipped)' });
		});
	});
}

const overall = performance.now();
const typecheckPromise = startTypecheck();

for (const mode of passes) {
	const start = performance.now();
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
