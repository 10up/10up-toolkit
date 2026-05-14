import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from '@rstest/core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	globals: true,
	testEnvironment: 'jsdom',
	include: [
		'**/__tests__/**/*.[jt]s?(x)',
		'**/test/*.[jt]s?(x)',
		'**/?(*.)test.[jt]s?(x)',
	],
	exclude: [
		'**/node_modules/**',
		'**/vendor/**',
	],
	setupFiles: [
		'@wordpress/jest-console',
	],
});
