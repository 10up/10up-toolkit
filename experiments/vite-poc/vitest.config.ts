/**
 * Vitest config for the POC plugin tests. Separate from vite.config.ts
 * because that one sets `root: fixture-plugin/`, which scopes Vitest to
 * the fixture; we want to test the plugins themselves (under vite-plugins/).
 *
 * `defineConfig` imported from `vite` (not `vitest/config`) so we don't
 * need vitest installed as a project dep — vp bundles it.
 */
import { defineConfig } from 'vite';

export default defineConfig({
	// @ts-expect-error — `test` is the Vitest extension to Vite config; not
	// in Vite's own type unless vitest's types are installed locally.
	test: {
		root: import.meta.dirname,
		include: ['vite-plugins/**/*.test.ts'],
	},
});
