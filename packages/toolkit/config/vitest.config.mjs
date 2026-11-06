/**
 * Default Vitest config for projects tested with `10up-toolkit test`.
 * Toolkit passes it with `--config` when the project has no Vite or Vitest
 * config of its own.
 */
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite-plus';
import { jsxInJs } from './vite/index.mjs';

export default defineConfig({
	root: process.cwd(),
	plugins: [jsxInJs()],
	test: {
		environment: 'jsdom',
		globals: true,
		include: [
			'**/__tests__/**/*.{js,jsx,ts,tsx}',
			'**/test/*.{js,jsx,ts,tsx}',
			'**/*.test.{js,jsx,ts,tsx}',
		],
		exclude: ['**/node_modules/**', '**/vendor/**', '**/dist/**', '**/__fixtures__/**'],
		setupFiles: [fileURLToPath(new URL('./vitest.setup.mjs', import.meta.url))],
	},
});
