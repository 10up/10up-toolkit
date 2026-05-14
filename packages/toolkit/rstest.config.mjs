import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from '@rstest/core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	globals: true,
	testEnvironment: 'node',
	include: [
		'**/__tests__/**/*.[jt]s?(x)',
		'**/test/*.[jt]s?(x)',
		'**/?(*.)test.[jt]s?(x)',
	],
	exclude: [
		'**/node_modules/**',
		'**/vendor/**',
		'**/__fixtures__/**',
		'**/dist/**',
		'__tests__/build-project-overriding-config-files/filenames.config.js',
	],
	setupFiles: [
		'@wordpress/jest-console',
	],
	resolve: {
		alias: {
			// CSS/style imports should resolve to an empty mock in tests
		},
	},
	snapshotFormat: {
		printBasicPrototype: false,
	},
});
