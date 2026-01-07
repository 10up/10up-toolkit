/**
 * Snapshot tests for build outputs
 *
 * These tests verify the actual content of built files remains consistent
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { resolve, join } from 'node:path';
import { existsSync, readFileSync, rmSync, readdirSync, statSync } from 'node:fs';
import { build } from '../src/build.js';
import { defaultConfig } from '../src/config.js';
import type { BuildConfig } from '../src/types.js';

// Store original cwd
const originalCwd = process.cwd();
const originalEnv = process.env.NODE_ENV;

/**
 * Helper to get all files in a directory recursively
 */
function getAllFiles(dir: string, files: string[] = []): string[] {
	if (!existsSync(dir)) return files;

	const entries = readdirSync(dir);
	for (const entry of entries) {
		const fullPath = join(dir, entry);
		if (statSync(fullPath).isDirectory()) {
			getAllFiles(fullPath, files);
		} else {
			files.push(fullPath);
		}
	}
	return files;
}

/**
 * Helper to normalize JS content for snapshot comparison
 * Removes content hashes that change between builds
 */
function normalizeJsContent(content: string): string {
	return content
		// Remove source map comments
		.replace(/\/\/# sourceMappingURL=.+$/gm, '//# sourceMappingURL=[removed]')
		// Normalize line endings
		.replace(/\r\n/g, '\n');
}

/**
 * Helper to normalize PHP asset file content
 * Replaces dynamic version hashes with placeholder
 */
function normalizeAssetPhp(content: string): string {
	return content
		// Replace version hash with placeholder
		.replace(/'version' => '[a-f0-9]+'/, "'version' => '[HASH]'")
		// Normalize line endings
		.replace(/\r\n/g, '\n');
}

/**
 * Helper to normalize CSS content
 */
function normalizeCssContent(content: string): string {
	return content
		// Normalize line endings
		.replace(/\r\n/g, '\n');
}

describe('Build Output Snapshots', () => {
	describe('basic-project', () => {
		const fixtureDir = resolve(__dirname, 'fixtures/basic-project');
		const distDir = join(fixtureDir, 'dist-snapshots');

		beforeAll(async () => {
			process.chdir(fixtureDir);
			process.env.NODE_ENV = 'production';

			// Clean and build
			if (existsSync(distDir)) {
				rmSync(distDir, { recursive: true, force: true });
			}

			const config: Partial<BuildConfig> = {
				entry: {
					admin: './assets/js/admin.js',
					frontend: './assets/js/frontend.js',
					style: './assets/css/style.css',
				},
				paths: {
					...defaultConfig.paths,
					distDir: distDir,
				},
				wpDependencyExternals: true,
				useBlockAssets: false,
			};

			await build(config);
		});

		afterAll(() => {
			process.chdir(originalCwd);
			process.env.NODE_ENV = originalEnv;
			if (existsSync(distDir)) {
				rmSync(distDir, { recursive: true, force: true });
			}
		});

		it('should produce expected output files', () => {
			const files = getAllFiles(distDir).map((f) => f.replace(distDir, '').replace(/^\//, ''));
			expect(files.sort()).toMatchSnapshot('output-files');
		});

		it('should produce correct admin.js output', () => {
			const content = readFileSync(join(distDir, 'js/admin.js'), 'utf8');
			expect(normalizeJsContent(content)).toMatchSnapshot('admin.js');
		});

		it('should produce correct admin.asset.php output', () => {
			const content = readFileSync(join(distDir, 'js/admin.asset.php'), 'utf8');
			expect(normalizeAssetPhp(content)).toMatchSnapshot('admin.asset.php');
		});

		it('should produce correct frontend.js output', () => {
			const content = readFileSync(join(distDir, 'js/frontend.js'), 'utf8');
			expect(normalizeJsContent(content)).toMatchSnapshot('frontend.js');
		});

		it('should produce correct frontend.asset.php output', () => {
			const content = readFileSync(join(distDir, 'js/frontend.asset.php'), 'utf8');
			expect(normalizeAssetPhp(content)).toMatchSnapshot('frontend.asset.php');
		});

		it('should produce correct style.css output', () => {
			const content = readFileSync(join(distDir, 'css/style.css'), 'utf8');
			expect(normalizeCssContent(content)).toMatchSnapshot('style.css');
		});
	});

	describe('block-project', () => {
		const fixtureDir = resolve(__dirname, 'fixtures/block-project');
		const distDir = join(fixtureDir, 'dist-snapshots');

		beforeAll(async () => {
			process.chdir(fixtureDir);
			process.env.NODE_ENV = 'production';

			// Clean and build
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

			await build(config);
		});

		afterAll(() => {
			process.chdir(originalCwd);
			process.env.NODE_ENV = originalEnv;
			if (existsSync(distDir)) {
				rmSync(distDir, { recursive: true, force: true });
			}
		});

		it('should produce expected output files', () => {
			const files = getAllFiles(distDir).map((f) => f.replace(distDir, '').replace(/^\//, ''));
			expect(files.sort()).toMatchSnapshot('output-files');
		});

		it('should produce correct block.json output', () => {
			const content = readFileSync(join(distDir, 'blocks/test-block/block.json'), 'utf8');
			expect(JSON.parse(content)).toMatchSnapshot('block.json');
		});

		it('should produce correct index.js (editor script) output', () => {
			const content = readFileSync(join(distDir, 'blocks/test-block/index.js'), 'utf8');
			expect(normalizeJsContent(content)).toMatchSnapshot('index.js');
		});

		it('should produce correct index.asset.php output', () => {
			const content = readFileSync(join(distDir, 'blocks/test-block/index.asset.php'), 'utf8');
			expect(normalizeAssetPhp(content)).toMatchSnapshot('index.asset.php');
		});

		it('should produce correct view.js output', () => {
			const content = readFileSync(join(distDir, 'blocks/test-block/view.js'), 'utf8');
			expect(normalizeJsContent(content)).toMatchSnapshot('view.js');
		});

		it('should produce correct view.asset.php output', () => {
			const content = readFileSync(join(distDir, 'blocks/test-block/view.asset.php'), 'utf8');
			expect(normalizeAssetPhp(content)).toMatchSnapshot('view.asset.php');
		});

		it('should produce correct view-module.mjs (ES module) output', () => {
			const content = readFileSync(join(distDir, 'blocks/test-block/view-module.mjs'), 'utf8');
			expect(normalizeJsContent(content)).toMatchSnapshot('view-module.mjs');
		});

		it('should produce correct view-module.asset.php output', () => {
			const content = readFileSync(
				join(distDir, 'blocks/test-block/view-module.asset.php'),
				'utf8',
			);
			expect(normalizeAssetPhp(content)).toMatchSnapshot('view-module.asset.php');
		});

		it('should produce correct editor.css output', () => {
			const content = readFileSync(join(distDir, 'blocks/test-block/editor.css'), 'utf8');
			expect(normalizeCssContent(content)).toMatchSnapshot('editor.css');
		});

		it('should produce correct style.css output', () => {
			const content = readFileSync(join(distDir, 'blocks/test-block/style.css'), 'utf8');
			expect(normalizeCssContent(content)).toMatchSnapshot('style.css');
		});
	});

	describe('postcss-project', () => {
		const fixtureDir = resolve(__dirname, 'fixtures/postcss-project');
		const distDir = join(fixtureDir, 'dist-snapshots');

		beforeAll(async () => {
			process.chdir(fixtureDir);
			process.env.NODE_ENV = 'production';

			// Clean and build
			if (existsSync(distDir)) {
				rmSync(distDir, { recursive: true, force: true });
			}

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

			await build(config);
		});

		afterAll(() => {
			process.chdir(originalCwd);
			process.env.NODE_ENV = originalEnv;
			if (existsSync(distDir)) {
				rmSync(distDir, { recursive: true, force: true });
			}
		});

		it('should produce expected output files', () => {
			const files = getAllFiles(distDir).map((f) => f.replace(distDir, '').replace(/^\//, ''));
			expect(files.sort()).toMatchSnapshot('output-files');
		});

		it('should produce correct style.css with PostCSS processing', () => {
			const content = readFileSync(join(distDir, 'css/style.css'), 'utf8');
			expect(normalizeCssContent(content)).toMatchSnapshot('style.css');
		});
	});
});
