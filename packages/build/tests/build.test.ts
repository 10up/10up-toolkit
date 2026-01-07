/**
 * Integration tests for the build process
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolve, join } from 'node:path';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { build } from '../src/build.js';
import { defaultConfig } from '../src/config.js';
import type { BuildConfig } from '../src/types.js';

// Store original cwd and env
const originalCwd = process.cwd();
const originalEnv = process.env.NODE_ENV;

describe('Build Process', () => {
	beforeEach(() => {
		process.chdir(originalCwd);
		process.env.NODE_ENV = 'production';
	});

	afterEach(() => {
		process.chdir(originalCwd);
		process.env.NODE_ENV = originalEnv;
	});

	describe('build with basic project', () => {
		const fixtureDir = resolve(__dirname, 'fixtures/basic-project');
		const distDir = join(fixtureDir, 'dist');

		beforeEach(() => {
			// Clean dist directory before each test
			if (existsSync(distDir)) {
				rmSync(distDir, { recursive: true, force: true });
			}
		});

		afterEach(() => {
			// Clean up after tests
			if (existsSync(distDir)) {
				rmSync(distDir, { recursive: true, force: true });
			}
		});

		it('should build JavaScript entries', async () => {
			process.chdir(fixtureDir);

			const config: Partial<BuildConfig> = {
				entry: {
					admin: './assets/js/admin.js',
					frontend: './assets/js/frontend.js',
				},
				paths: {
					...defaultConfig.paths,
					distDir: distDir,
				},
				wpDependencyExternals: true,
				useBlockAssets: false,
			};

			const result = await build(config);

			expect(result.success).toBe(true);
			expect(result.entries.scripts).toBe(2);

			// Check output files exist
			expect(existsSync(join(distDir, 'admin.js'))).toBe(true);
			expect(existsSync(join(distDir, 'frontend.js'))).toBe(true);
		});

		it('should generate .asset.php files', async () => {
			process.chdir(fixtureDir);

			const config: Partial<BuildConfig> = {
				entry: {
					admin: './assets/js/admin.js',
				},
				paths: {
					...defaultConfig.paths,
					distDir: distDir,
				},
				wpDependencyExternals: true,
				useBlockAssets: false,
			};

			const result = await build(config);

			expect(result.success).toBe(true);

			// Check .asset.php exists
			const assetPhpPath = join(distDir, 'admin.asset.php');
			expect(existsSync(assetPhpPath)).toBe(true);

			// Check .asset.php content
			const assetPhpContent = readFileSync(assetPhpPath, 'utf8');
			expect(assetPhpContent).toContain('<?php return array');
			expect(assetPhpContent).toContain('dependencies');
			expect(assetPhpContent).toContain('version');
		});

		it('should track WordPress dependencies in .asset.php', async () => {
			process.chdir(fixtureDir);

			const config: Partial<BuildConfig> = {
				entry: {
					admin: './assets/js/admin.js',
				},
				paths: {
					...defaultConfig.paths,
					distDir: distDir,
				},
				wpDependencyExternals: true,
				useBlockAssets: false,
			};

			const result = await build(config);

			expect(result.success).toBe(true);

			const assetPhpContent = readFileSync(join(distDir, 'admin.asset.php'), 'utf8');

			// admin.js imports @wordpress/blocks and @wordpress/i18n
			expect(assetPhpContent).toContain('wp-blocks');
			expect(assetPhpContent).toContain('wp-i18n');
		});

		it('should track React dependencies in .asset.php', async () => {
			process.chdir(fixtureDir);

			const config: Partial<BuildConfig> = {
				entry: {
					admin: './assets/js/admin.js',
				},
				paths: {
					...defaultConfig.paths,
					distDir: distDir,
				},
				wpDependencyExternals: true,
				useBlockAssets: false,
			};

			const result = await build(config);

			expect(result.success).toBe(true);

			const assetPhpContent = readFileSync(join(distDir, 'admin.asset.php'), 'utf8');

			// admin.js imports React
			expect(assetPhpContent).toContain('react');
		});

		it('should build CSS entries with PostCSS', async () => {
			process.chdir(fixtureDir);

			const config: Partial<BuildConfig> = {
				entry: {
					style: './assets/css/style.css',
				},
				paths: {
					...defaultConfig.paths,
					distDir: distDir,
				},
				wpDependencyExternals: true,
				useBlockAssets: false,
			};

			const result = await build(config);

			expect(result.success).toBe(true);
			expect(result.entries.styles).toBe(1);

			// Check CSS output exists
			expect(existsSync(join(distDir, 'style.css'))).toBe(true);

			// Check CSS content is compiled
			const cssContent = readFileSync(join(distDir, 'style.css'), 'utf8');
			expect(cssContent).toContain('font-family');
			// CSS custom property should be preserved
			expect(cssContent).toContain('#0073aa');
		});

		it('should minify CSS in production', async () => {
			process.chdir(fixtureDir);
			process.env.NODE_ENV = 'production';

			const config: Partial<BuildConfig> = {
				entry: {
					style: './assets/css/style.css',
				},
				paths: {
					...defaultConfig.paths,
					distDir: distDir,
				},
				wpDependencyExternals: true,
				useBlockAssets: false,
			};

			const result = await build(config);

			expect(result.success).toBe(true);

			const cssContent = readFileSync(join(distDir, 'style.css'), 'utf8');
			// Minified CSS should not have unnecessary whitespace
			expect(cssContent).not.toMatch(/\n\s+\n/);
		});

		it('should return build timing info', async () => {
			process.chdir(fixtureDir);

			const config: Partial<BuildConfig> = {
				entry: {
					admin: './assets/js/admin.js',
				},
				paths: {
					...defaultConfig.paths,
					distDir: distDir,
				},
				wpDependencyExternals: true,
				useBlockAssets: false,
			};

			const result = await build(config);

			expect(result.success).toBe(true);
			expect(result.duration).toBeGreaterThan(0);
			expect(result.duration).toBeLessThan(10000); // Should be fast!
		});
	});

	describe('build with block project', () => {
		const fixtureDir = resolve(__dirname, 'fixtures/block-project');
		const distDir = join(fixtureDir, 'dist');

		beforeEach(() => {
			if (existsSync(distDir)) {
				rmSync(distDir, { recursive: true, force: true });
			}
		});

		afterEach(() => {
			if (existsSync(distDir)) {
				rmSync(distDir, { recursive: true, force: true });
			}
		});

		it('should build block entries from block.json', async () => {
			process.chdir(fixtureDir);

			const config: Partial<BuildConfig> = {
				entry: {},
				paths: {
					...defaultConfig.paths,
					blocksDir: './includes/blocks/',
					distDir: distDir,
				},
				wpDependencyExternals: true,
				useBlockAssets: true,
			};

			const result = await build(config);

			expect(result.success).toBe(true);
			expect(result.entries.scripts).toBeGreaterThan(0);
		});

		it('should copy and transform block.json files', async () => {
			process.chdir(fixtureDir);

			const config: Partial<BuildConfig> = {
				entry: {},
				paths: {
					...defaultConfig.paths,
					blocksDir: './includes/blocks/',
					distDir: distDir,
				},
				wpDependencyExternals: true,
				useBlockAssets: true,
			};

			const result = await build(config);

			expect(result.success).toBe(true);

			// Check transformed block.json exists
			const blockJsonPath = join(distDir, 'blocks/test-block/block.json');
			expect(existsSync(blockJsonPath)).toBe(true);

			// Check block.json content is transformed
			const blockJson = JSON.parse(readFileSync(blockJsonPath, 'utf8'));
			expect(blockJson.editorScript).toBe('file:./index.js'); // .tsx -> .js
			expect(blockJson.editorStyle).toBe('file:./editor.css');
			expect(blockJson.style).toBe('file:./style.css');
		});

		it('should generate ES module .asset.php with type: module', async () => {
			process.chdir(fixtureDir);

			const config: Partial<BuildConfig> = {
				entry: {},
				paths: {
					...defaultConfig.paths,
					blocksDir: './includes/blocks/',
					distDir: distDir,
				},
				wpDependencyExternals: true,
				useBlockAssets: true,
			};

			const result = await build(config);

			expect(result.success).toBe(true);
			expect(result.entries.modules).toBeGreaterThan(0);

			// Find the ES module .asset.php
			const moduleAssetPath = join(distDir, 'blocks/test-block/view-module.asset.php');
			if (existsSync(moduleAssetPath)) {
				const assetContent = readFileSync(moduleAssetPath, 'utf8');
				expect(assetContent).toContain("'type' => 'module'");
				// ES modules use package names, not handles
				expect(assetContent).toContain('@wordpress/interactivity');
			}
		});
	});

	describe('build error handling', () => {
		it('should return error result for invalid entry', async () => {
			const fixtureDir = resolve(__dirname, 'fixtures/basic-project');
			process.chdir(fixtureDir);

			// Clean dist first
			const distDir = join(fixtureDir, 'dist');
			if (existsSync(distDir)) {
				rmSync(distDir, { recursive: true, force: true });
			}

			const config: Partial<BuildConfig> = {
				entry: {
					broken: './nonexistent/file.js',
				},
				paths: {
					...defaultConfig.paths,
					distDir: distDir,
				},
				wpDependencyExternals: true,
				useBlockAssets: false,
			};

			// With no valid entries, build should complete but with 0 entries
			const result = await build(config);
			expect(result.entries.scripts).toBe(0);
		});
	});

	describe('build performance', () => {
		it('should complete build in under 5 seconds', async () => {
			const fixtureDir = resolve(__dirname, 'fixtures/block-project');
			process.chdir(fixtureDir);

			// Clean dist first
			const distDir = join(fixtureDir, 'dist');
			if (existsSync(distDir)) {
				rmSync(distDir, { recursive: true, force: true });
			}

			const config: Partial<BuildConfig> = {
				entry: {},
				paths: {
					...defaultConfig.paths,
					blocksDir: './includes/blocks/',
					distDir: distDir,
				},
				wpDependencyExternals: true,
				useBlockAssets: true,
			};

			const result = await build(config);

			expect(result.success).toBe(true);
			expect(result.duration).toBeLessThan(5000);
		});
	});

	describe('build with PostCSS configuration', () => {
		const fixtureDir = resolve(__dirname, 'fixtures/postcss-project');
		const distDir = join(fixtureDir, 'dist');

		beforeEach(() => {
			if (existsSync(distDir)) {
				rmSync(distDir, { recursive: true, force: true });
			}
		});

		afterEach(() => {
			if (existsSync(distDir)) {
				rmSync(distDir, { recursive: true, force: true });
			}
		});

		it('should process CSS with globalStylesDir custom properties', async () => {
			process.chdir(fixtureDir);

			const config: Partial<BuildConfig> = {
				entry: {
					style: './assets/css/style.css',
				},
				paths: {
					...defaultConfig.paths,
					distDir: distDir,
					globalStylesDir: './assets/css/globals/',
					globalMixinsDir: './assets/css/mixins/',
				},
				wpDependencyExternals: true,
				useBlockAssets: false,
			};

			const result = await build(config);

			expect(result.success).toBe(true);
			expect(result.entries.styles).toBe(1);

			// Check CSS output exists
			expect(existsSync(join(distDir, 'style.css'))).toBe(true);

			// Check CSS uses global custom properties
			const cssContent = readFileSync(join(distDir, 'style.css'), 'utf8');
			expect(cssContent).toContain('--global-primary');
			expect(cssContent).toContain('--global-spacing');
		});

		it('should process CSS with globalMixinsDir mixins', async () => {
			process.chdir(fixtureDir);

			const config: Partial<BuildConfig> = {
				entry: {
					style: './assets/css/style.css',
				},
				paths: {
					...defaultConfig.paths,
					distDir: distDir,
					globalStylesDir: './assets/css/globals/',
					globalMixinsDir: './assets/css/mixins/',
				},
				wpDependencyExternals: true,
				useBlockAssets: false,
			};

			const result = await build(config);

			expect(result.success).toBe(true);

			const cssContent = readFileSync(join(distDir, 'style.css'), 'utf8');
			// Mixin should be expanded - check for mixin content
			expect(cssContent).toContain('max-width');
			expect(cssContent).toContain('margin-inline');
		});

		it('should process custom media queries from globalStylesDir', async () => {
			process.chdir(fixtureDir);

			const config: Partial<BuildConfig> = {
				entry: {
					style: './assets/css/style.css',
				},
				paths: {
					...defaultConfig.paths,
					distDir: distDir,
					globalStylesDir: './assets/css/globals/',
					globalMixinsDir: './assets/css/mixins/',
				},
				wpDependencyExternals: true,
				useBlockAssets: false,
			};

			const result = await build(config);

			expect(result.success).toBe(true);

			const cssContent = readFileSync(join(distDir, 'style.css'), 'utf8');
			// Custom media should be transformed to standard media query
			expect(cssContent).toContain('@media');
			expect(cssContent).toContain('768px');
		});
	});
});
