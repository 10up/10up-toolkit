/**
 * Single-process dual-pass build for the 10up-theme Vite port.
 * See `experiments/vite-poc/build.mjs` for the why.
 */
import { build } from 'vite';
import { performance } from 'node:perf_hooks';

const args = process.argv.slice(2);
const onlyMode = args.find((a) => a.startsWith('--mode='))?.slice('--mode='.length);

const passes = onlyMode ? [onlyMode] : ['production', 'modules'];

const overall = performance.now();
for (const mode of passes) {
	const start = performance.now();
	// Passes are intentionally sequential: the script pass clears dist
	// (emptyOutDir), the module pass adds to it. Parallel would race.
	// eslint-disable-next-line no-await-in-loop
	await build({
		mode,
		logLevel: 'info',
	});
	const elapsed = performance.now() - start;
	console.log(`✓ ${mode} pass: ${(elapsed / 1000).toFixed(2)}s`);
}
const total = performance.now() - overall;
console.log(`✓ total: ${(total / 1000).toFixed(2)}s`);
