import { describe, it, expect } from 'vite-plus/test';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { createBaseConfig, resolveEntries } from '../index.mjs';

const FILENAMES = {
	js: 'js/[name].js',
	jsChunk: 'js/[name].[contenthash].chunk.js',
	css: 'css/[name].css',
	block: 'blocks/[name]/editor.js',
	blockCSS: 'blocks/[name]/editor.css',
};

function makeProject(files) {
	const root = mkdtempSync(join(tmpdir(), 'toolkit-vite-config-'));
	for (const file of files) {
		mkdirSync(join(root, dirname(file)), { recursive: true });
		writeFileSync(join(root, file), '');
	}
	return root;
}

describe('resolveEntries', () => {
	it('keys entries by their toolkit dist path', () => {
		const root = makeProject([
			'assets/js/admin.js',
			'assets/css/style.css',
			'includes/blocks/cta/index.js',
		]);
		try {
			const { input, cssForChunk } = resolveEntries(
				{
					admin: './assets/js/admin.js',
					style: './assets/css/style.css',
					'cta-block': './includes/blocks/cta/index.js',
					missing: './assets/js/missing.js',
				},
				FILENAMES,
				root,
			);
			expect(Object.keys(input).sort()).toEqual([
				'blocks/cta-block/editor',
				'css/style',
				'js/admin',
			]);
			// The CSS a JS entry imports lands where toolkit 7 put it.
			expect(cssForChunk).toEqual({
				'js/admin': 'css/admin',
				'blocks/cta-block/editor': 'blocks/cta-block/editor',
			});
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});
});

describe('createBaseConfig', () => {
	const project = (overrides = {}) => ({
		entry: {},
		moduleEntry: {},
		filenames: FILENAMES,
		paths: {
			blocksDir: './includes/blocks/',
			blocksStyles: './assets/css/blocks/',
			copyAssetsDir: './assets/',
			globalMixinsDir: './assets/css/mixins/',
			globalStylesDir: './assets/css/globals/',
		},
		wordpress: true,
		wpDependencyExternals: true,
		useBlockAssets: true,
		loadBlockSpecificStyles: false,
		devServerPort: 8000,
		...overrides,
	});

	const pluginNames = (config) => config.plugins.flat().map((plugin) => plugin.name);

	it('assumes WordPress provides uninstalled @wordpress packages', () => {
		const root = makeProject([]);
		try {
			const config = createBaseConfig(
				{ mode: 'production', command: 'build' },
				{ project: project(), package: false },
				root,
			);
			expect(pluginNames(config)).toContain('wp-externals(script)');
			expect(pluginNames(config)).toContain('10up-toolkit:jsx-in-js');
			expect(pluginNames(config)).toContain('10up-toolkit:fast-refresh-shim');
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});

	it('drops externals and sidecars with wpDependencyExternals: false', () => {
		const root = makeProject([]);
		try {
			const config = createBaseConfig(
				{ mode: 'production', command: 'build' },
				{ project: project({ wpDependencyExternals: false }), package: false },
				root,
			);
			expect(pluginNames(config).some((name) => name.startsWith('wp-externals'))).toBe(false);
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});

	it('builds module entries in the module pass only', () => {
		const root = makeProject(['assets/js/view.js', 'assets/js/admin.js']);
		try {
			const toolkitConfig = {
				project: project({
					entry: { admin: './assets/js/admin.js' },
					moduleEntry: { view: './assets/js/view.js' },
				}),
				package: false,
			};
			const script = createBaseConfig({ mode: 'production' }, toolkitConfig, root);
			const modules = createBaseConfig({ mode: 'modules' }, toolkitConfig, root);
			expect(Object.keys(script.build.rollupOptions.input)).toEqual(['js/admin']);
			expect(Object.keys(modules.build.rollupOptions.input)).toEqual(['js/view']);
			expect(modules.build.emptyOutDir).toBe(false);
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});

	it('builds a library from source/main', () => {
		const root = makeProject(['src/index.js']);
		try {
			const config = createBaseConfig(
				{ mode: 'production' },
				{
					project: project(),
					package: {
						source: 'src/index.js',
						main: 'dist/index.js',
						externals: ['xss'],
						libraryName: 'Example',
						packageType: 'all',
					},
				},
				root,
			);
			expect(config.build.lib.formats).toEqual(['cjs']);
			expect(config.build.outDir).toBe('dist');
			expect(config.build.rollupOptions.external('xss/lib/x')).toBe(true);
			expect(config.build.rollupOptions.external('lodash')).toBe(false);
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});
});
