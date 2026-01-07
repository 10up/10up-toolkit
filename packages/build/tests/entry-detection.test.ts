/**
 * Tests for entry point detection
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolve } from 'node:path';
import { detectEntries } from '../src/utils/entry-detection.js';
import { defaultConfig } from '../src/config.js';
import type { BuildConfig } from '../src/types.js';

// Store original cwd
const originalCwd = process.cwd();

describe('Entry Detection', () => {
	beforeEach(() => {
		process.chdir(originalCwd);
	});

	afterEach(() => {
		process.chdir(originalCwd);
	});

	describe('detectEntries with basic project', () => {
		it('should detect entries from config.entry', async () => {
			const fixtureDir = resolve(__dirname, 'fixtures/basic-project');
			process.chdir(fixtureDir);

			const config: BuildConfig = {
				...defaultConfig,
				entry: {
					admin: './assets/js/admin.js',
					frontend: './assets/js/frontend.js',
					style: './assets/css/style.css',
				},
				useBlockAssets: false,
			};

			const entries = await detectEntries(config);

			// Should have 2 script entries and 1 style entry
			expect(Object.keys(entries.scripts)).toHaveLength(2);
			expect(Object.keys(entries.styles)).toHaveLength(1);
			expect(Object.keys(entries.modules)).toHaveLength(0);

			// Check script entries
			expect(entries.scripts.admin).toContain('admin.js');
			expect(entries.scripts.frontend).toContain('frontend.js');

			// Check style entries
			expect(entries.styles.style).toContain('style.css');
		});

		it('should separate JS and CSS entries', async () => {
			const fixtureDir = resolve(__dirname, 'fixtures/basic-project');
			process.chdir(fixtureDir);

			const config: BuildConfig = {
				...defaultConfig,
				entry: {
					admin: './assets/js/admin.js',
					style: './assets/css/style.css',
				},
				useBlockAssets: false,
			};

			const entries = await detectEntries(config);

			expect(entries.scripts.admin).toBeDefined();
			expect(entries.scripts.style).toBeUndefined();
			expect(entries.styles.style).toBeDefined();
			expect(entries.styles.admin).toBeUndefined();
		});

		it('should skip non-existent files', async () => {
			const fixtureDir = resolve(__dirname, 'fixtures/basic-project');
			process.chdir(fixtureDir);

			const config: BuildConfig = {
				...defaultConfig,
				entry: {
					admin: './assets/js/admin.js',
					nonexistent: './assets/js/does-not-exist.js',
				},
				useBlockAssets: false,
			};

			const entries = await detectEntries(config);

			expect(entries.scripts.admin).toBeDefined();
			expect(entries.scripts.nonexistent).toBeUndefined();
		});
	});

	describe('detectEntries with block project', () => {
		it('should detect entries from block.json files', async () => {
			const fixtureDir = resolve(__dirname, 'fixtures/block-project');
			process.chdir(fixtureDir);

			const config: BuildConfig = {
				...defaultConfig,
				entry: {},
				paths: {
					...defaultConfig.paths,
					blocksDir: './includes/blocks/',
				},
				useBlockAssets: true,
			};

			const entries = await detectEntries(config);

			// Should detect editorScript, viewScript from block.json
			expect(Object.keys(entries.scripts).length).toBeGreaterThan(0);

			// Should detect viewScriptModule
			expect(Object.keys(entries.modules).length).toBeGreaterThan(0);

			// Should detect style, editorStyle
			expect(Object.keys(entries.styles).length).toBeGreaterThan(0);
		});

		it('should find TypeScript source files for JS references', async () => {
			const fixtureDir = resolve(__dirname, 'fixtures/block-project');
			process.chdir(fixtureDir);

			const config: BuildConfig = {
				...defaultConfig,
				entry: {},
				paths: {
					...defaultConfig.paths,
					blocksDir: './includes/blocks/',
				},
				useBlockAssets: true,
			};

			const entries = await detectEntries(config);

			// Should find index.tsx for editorScript: "file:./index.tsx"
			const indexEntry = Object.entries(entries.scripts).find(([key]) =>
				key.includes('test-block/index'),
			);
			expect(indexEntry).toBeDefined();
			expect(indexEntry?.[1]).toContain('.tsx');
		});

		it('should find CSS source files for CSS references', async () => {
			const fixtureDir = resolve(__dirname, 'fixtures/block-project');
			process.chdir(fixtureDir);

			const config: BuildConfig = {
				...defaultConfig,
				entry: {},
				paths: {
					...defaultConfig.paths,
					blocksDir: './includes/blocks/',
				},
				useBlockAssets: true,
			};

			const entries = await detectEntries(config);

			// Should find style.css for style: "file:./style.css"
			const styleEntry = Object.entries(entries.styles).find(([key]) =>
				key.includes('test-block/style'),
			);
			expect(styleEntry).toBeDefined();
			expect(styleEntry?.[1]).toContain('.css');
		});

		it('should detect ES module entries', async () => {
			const fixtureDir = resolve(__dirname, 'fixtures/block-project');
			process.chdir(fixtureDir);

			const config: BuildConfig = {
				...defaultConfig,
				entry: {},
				paths: {
					...defaultConfig.paths,
					blocksDir: './includes/blocks/',
				},
				useBlockAssets: true,
			};

			const entries = await detectEntries(config);

			// Should detect viewScriptModule
			const moduleEntry = Object.entries(entries.modules).find(([key]) =>
				key.includes('view-module'),
			);
			expect(moduleEntry).toBeDefined();
		});
	});

	describe('detectEntries with moduleEntry config', () => {
		it('should detect module entries from config.moduleEntry', async () => {
			const fixtureDir = resolve(__dirname, 'fixtures/block-project');
			process.chdir(fixtureDir);

			const config: BuildConfig = {
				...defaultConfig,
				entry: {},
				moduleEntry: {
					'custom-module': './includes/blocks/test-block/view-module.js',
				},
				useBlockAssets: false,
			};

			const entries = await detectEntries(config);

			expect(entries.modules['custom-module']).toBeDefined();
			expect(entries.modules['custom-module']).toContain('view-module.js');
		});
	});

	describe('detectEntries with empty config', () => {
		it('should return empty entries when no sources found', async () => {
			const fixtureDir = resolve(__dirname, 'fixtures/basic-project');
			process.chdir(fixtureDir);

			const config: BuildConfig = {
				...defaultConfig,
				entry: {},
				moduleEntry: {},
				paths: {
					...defaultConfig.paths,
					blocksDir: './nonexistent-blocks/',
				},
				useBlockAssets: true,
			};

			const entries = await detectEntries(config);

			expect(Object.keys(entries.scripts)).toHaveLength(0);
			expect(Object.keys(entries.modules)).toHaveLength(0);
			expect(Object.keys(entries.styles)).toHaveLength(0);
		});
	});
});
