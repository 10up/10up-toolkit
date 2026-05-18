/**
 * Single-process dual-pass build.
 *
 * `vite build && vite build --mode modules` runs two separate `node` +
 * Vite-init cycles back-to-back, each paying ~500–800ms before doing any
 * real work. Doing both passes through Vite's programmatic build API in
 * one Node process eliminates that fixed cost.
 */
import { build } from 'vite';
import { performance } from 'node:perf_hooks';

const args = process.argv.slice(2);
const onlyMode = args.find((a) => a.startsWith('--mode='))?.slice('--mode='.length);

const passes = onlyMode ? [onlyMode] : ['production', 'modules'];

const overall = performance.now();
for (const mode of passes) {
	const start = performance.now();
	await build({
		// `mode` flows through to defineConfig(({ mode }) => …)
		mode,
		// Keep CLI output friendly.
		logLevel: 'info',
	});
	const elapsed = performance.now() - start;
	console.log(`✓ ${mode} pass: ${(elapsed / 1000).toFixed(2)}s`);
}
const total = performance.now() - overall;
console.log(`✓ total: ${(total / 1000).toFixed(2)}s`);
