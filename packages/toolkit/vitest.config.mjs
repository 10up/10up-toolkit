/**
 * Vitest config for 10up-toolkit's own tests (not for projects; see
 * config/vitest.config.mjs for that).
 */
import { defineConfig } from 'vite-plus';

export default defineConfig({
	test: {
		environment: 'node',
		include: ['__tests__/*/test.js', 'utils/__tests__/*.test.js', 'config/**/__tests__/*.test.mjs'],
		// Every build-project fixture spawns a real Vite+ build.
		testTimeout: 120_000,
		hookTimeout: 120_000,
	},
});
