/**
 * Tests for configuration loading
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { resolve } from 'node:path';
import { defaultConfig } from '../src/config.js';

// Store original cwd
const originalCwd = process.cwd();

describe('Configuration Loading', () => {
	beforeEach(() => {
		// Reset to original directory before each test
		process.chdir(originalCwd);
	});

	afterEach(() => {
		process.chdir(originalCwd);
		vi.resetModules();
	});

	describe('defaultConfig', () => {
		it('should have correct default paths', () => {
			expect(defaultConfig.paths.blocksDir).toBe('./includes/blocks/');
			expect(defaultConfig.paths.srcDir).toBe('./assets/');
			expect(defaultConfig.paths.copyAssetsDir).toBe('./assets/');
			expect(defaultConfig.paths.blocksStyles).toBe('./assets/css/blocks/');
			expect(defaultConfig.paths.globalStylesDir).toBe('./assets/css/globals/');
			expect(defaultConfig.paths.globalMixinsDir).toBe('./assets/css/mixins/');
		});

		it('should have correct default filenames', () => {
			expect(defaultConfig.filenames.js).toBe('js/[name].js');
			expect(defaultConfig.filenames.jsChunk).toBe('js/[name].[contenthash].chunk.js');
			expect(defaultConfig.filenames.css).toBe('css/[name].css');
			expect(defaultConfig.filenames.block).toBe('blocks/[name].js');
			expect(defaultConfig.filenames.blockCSS).toBe('blocks/[name].css');
		});

		it('should have wpDependencyExternals enabled by default', () => {
			expect(defaultConfig.wpDependencyExternals).toBe(true);
		});

		it('should have useBlockAssets disabled by default', () => {
			expect(defaultConfig.useBlockAssets).toBe(false);
		});

		it('should have hot reload disabled by default', () => {
			expect(defaultConfig.hot).toBe(false);
		});

		it('should have correct default dev server port', () => {
			expect(defaultConfig.devServerPort).toBe(8887);
		});

		it('should have empty entry points by default', () => {
			expect(defaultConfig.entry).toEqual({});
			expect(defaultConfig.moduleEntry).toEqual({});
		});

		it('should have empty external namespaces by default', () => {
			expect(defaultConfig.externalNamespaces).toEqual({});
		});
	});

	describe('loadConfig', () => {
		it('should load config from basic project', async () => {
			const fixtureDir = resolve(__dirname, 'fixtures/basic-project');
			process.chdir(fixtureDir);

			// Re-import to get fresh module with new cwd
			const { loadConfig } = await import('../src/config.js');
			const config = loadConfig();

			expect(config.entry).toEqual({
				admin: './assets/js/admin.js',
				frontend: './assets/js/frontend.js',
				style: './assets/css/style.scss',
			});
			expect(config.wpDependencyExternals).toBe(true);
			expect(config.useBlockAssets).toBe(false);
		});

		it('should load config from block project', async () => {
			const fixtureDir = resolve(__dirname, 'fixtures/block-project');
			process.chdir(fixtureDir);

			const { loadConfig } = await import('../src/config.js');
			const config = loadConfig();

			expect(config.entry).toEqual({});
			expect(config.useBlockAssets).toBe(true);
			expect(config.wpDependencyExternals).toBe(true);
		});

		it('should merge paths with defaults', async () => {
			const fixtureDir = resolve(__dirname, 'fixtures/basic-project');
			process.chdir(fixtureDir);

			const { loadConfig } = await import('../src/config.js');
			const config = loadConfig();

			// Custom path from fixture
			expect(config.paths.blocksDir).toBe('./includes/blocks/');
			// Default path (not overridden)
			expect(config.paths.globalStylesDir).toBe('./assets/css/globals/');
		});
	});

	describe('isProduction', () => {
		const originalEnv = process.env.NODE_ENV;

		afterEach(() => {
			process.env.NODE_ENV = originalEnv;
		});

		it('should return true when NODE_ENV is production', async () => {
			process.env.NODE_ENV = 'production';
			const { isProduction } = await import('../src/config.js');
			expect(isProduction()).toBe(true);
		});

		it('should return false when NODE_ENV is development', async () => {
			process.env.NODE_ENV = 'development';
			const { isProduction } = await import('../src/config.js');
			expect(isProduction()).toBe(false);
		});

		it('should return false when NODE_ENV is not set', async () => {
			delete process.env.NODE_ENV;
			const { isProduction } = await import('../src/config.js');
			expect(isProduction()).toBe(false);
		});
	});

	describe('getOutputDir', () => {
		it('should return dist directory path', async () => {
			const fixtureDir = resolve(__dirname, 'fixtures/basic-project');
			process.chdir(fixtureDir);

			const { loadConfig, getOutputDir } = await import('../src/config.js');
			const config = loadConfig();
			const outputDir = getOutputDir(config);

			expect(outputDir).toBe(resolve(fixtureDir, 'dist'));
		});
	});

	describe('Configuration with externalNamespaces', () => {
		it('should support custom external namespaces', async () => {
			// Create a temp config with external namespaces
			const config = {
				...defaultConfig,
				externalNamespaces: {
					'@woocommerce': {
						global: 'wc',
						handlePrefix: 'wc',
					},
					'@my-plugin': {
						global: 'myPlugin',
						handlePrefix: 'my-plugin',
					},
				},
			};

			expect(config.externalNamespaces['@woocommerce']).toEqual({
				global: 'wc',
				handlePrefix: 'wc',
			});
			expect(config.externalNamespaces['@my-plugin']).toEqual({
				global: 'myPlugin',
				handlePrefix: 'my-plugin',
			});
		});
	});
});
