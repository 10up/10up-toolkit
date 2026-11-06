/**
 * The Vite config 10up-toolkit builds a project with.
 *
 * `10up-toolkit build|watch|start` pass this file to Vite+ (`vp`) with
 * `--config` whenever the project has no `vite.config.*` of its own. It turns
 * the `"10up-toolkit"` block of package.json into a Vite config that drives
 * `@10up/wp-vite-plugins`, and keeps the dist layout toolkit 7 produced:
 *
 *   entry "admin": "./assets/js/admin/admin.js"   -> dist/js/admin.js
 *   CSS that admin.js imports                     -> dist/css/admin.css
 *   entry "style": "./assets/css/style.css"       -> dist/css/style.css
 *   block.json assets (useBlockAssets)            -> dist/blocks/<block>/…
 *   assets/css/blocks/** (loadBlockSpecificStyles) -> dist/blocks/autoenqueue/…
 *
 * A project that wants to change the generated config writes its own
 * `vite.config.mjs`:
 *
 *   import { toolkit } from '10up-toolkit/vite';
 *   export default toolkit({ server: { port: 5200 } });
 */
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { basename, dirname, extname, resolve } from 'node:path';
import fg from 'fast-glob';
import { defineConfig, mergeConfig, transformWithOxc } from 'vite-plus';
import { wp } from '@10up/wp-vite-plugins';

const require = createRequire(import.meta.url);

/** Extensions that make an entry a stylesheet. */
const STYLE_EXTENSION = /\.(css|scss|sass)$/i;

/** Env var the toolkit CLI uses to hand the resolved config to this file. */
export const CONFIG_ENV = 'TENUP_TOOLKIT_CONFIG';

/**
 * Read the toolkit config: from the CLI (which resolved CLI flags and
 * package.json for us), or straight from package.json when Vite+ loads this
 * file without the toolkit CLI in front of it.
 *
 * @returns {{ project: object, package: object | false }}
 */
export function readToolkitConfig() {
	if (process.env[CONFIG_ENV]) {
		return JSON.parse(process.env[CONFIG_ENV]);
	}
	const {
		getTenUpScriptsConfig,
		getTenUpScriptsPackageBuildConfig,
	} = require('../../utils/config.js');
	const packageBuild = getTenUpScriptsPackageBuildConfig();
	return {
		project: getTenUpScriptsConfig(),
		// Toolkit builds a library only when package.json has both `source` and `main`.
		package: packageBuild && packageBuild.source && packageBuild.main ? packageBuild : false,
	};
}

/** `filenames` pattern -> output path without extension, for one entry. */
function outputName(pattern, name) {
	return pattern.replace(/\[name\]/g, name).replace(/\.(js|css)$/, '');
}

/**
 * Is this entry a block asset? Toolkit 7 sent block assets to
 * `filenames.block` / `filenames.blockCSS` when the source lives in a
 * `block/` or `blocks/` directory, or when the entry name ends in `-block`.
 */
function isBlockAsset(name, sourcePath) {
	return /[\\/]blocks?[\\/]/.test(sourcePath) || /-block$/.test(name);
}

/**
 * Resolve the toolkit `entry` / `moduleEntry` maps into Rollup inputs keyed
 * by their final dist path, plus the dist path for the CSS each JS entry
 * imports.
 *
 * @param {Record<string, string>} entries   Entry name -> source path.
 * @param {object}                 filenames Toolkit `filenames` patterns.
 * @param {string}                 root      Project root.
 */
export function resolveEntries(entries, filenames, root) {
	const input = {};
	const cssForChunk = {};

	for (const [name, source] of Object.entries(entries ?? {})) {
		const sourcePath = resolve(root, source);
		if (!existsSync(sourcePath)) continue;

		const block = isBlockAsset(name, sourcePath);
		if (STYLE_EXTENSION.test(sourcePath)) {
			input[outputName(block ? filenames.blockCSS : filenames.css, name)] = sourcePath;
			continue;
		}

		const chunkName = outputName(block ? filenames.block : filenames.js, name);
		input[chunkName] = sourcePath;
		cssForChunk[chunkName] = outputName(block ? filenames.blockCSS : filenames.css, name);
	}

	return { input, cssForChunk };
}

/**
 * Toolkit 7 put the CSS a JS entry imports at `filenames.css`
 * (`dist/css/admin.css` for the `admin` entry), and a block script's CSS next
 * to the script (`dist/blocks/cta/index.css`). Vite names it after the
 * chunk's base name (`dist/admin.css`, `dist/index.css`), so this plugin
 * moves each entry's stylesheet to the toolkit path before any other plugin
 * reads the bundle.
 *
 * @param {Record<string, string>} cssForChunk Chunk name -> CSS path without extension.
 */
export function entryCssNames(cssForChunk) {
	// Stylesheets that are entries of their own. A script's copy of one can
	// share its file with the entry's output, and must not move it.
	const stylesheetEntryFiles = new Set();

	return {
		name: '10up-toolkit:entry-css-names',
		buildStart(inputOptions) {
			stylesheetEntryFiles.clear();
			const { input } = inputOptions;
			if (!input || typeof input !== 'object' || Array.isArray(input)) return;
			for (const [name, source] of Object.entries(input)) {
				if (STYLE_EXTENSION.test(source)) stylesheetEntryFiles.add(`${name}.css`);
			}
		},
		generateBundle: {
			order: 'pre',
			handler(_options, bundle) {
				for (const chunk of Object.values(bundle)) {
					if (chunk.type !== 'chunk' || !chunk.isEntry) continue;
					// Toolkit entries map to `filenames.css`; block entries keep the
					// stylesheet next to the script (`blocks/cta/index.css`).
					const target = cssForChunk[chunk.name] ?? chunk.name;
					const importedCss = chunk.viteMetadata?.importedCss;
					if (!target || !importedCss || importedCss.size === 0) continue;

					const renamed = new Set();
					const files = [...importedCss];
					for (const [index, fileName] of files.entries()) {
						const asset = bundle[fileName];
						if (!asset || asset.type !== 'asset') {
							renamed.add(fileName);
							continue;
						}
						// One stylesheet per entry is the norm; number any extras.
						const newName = index === 0 ? `${target}.css` : `${target}-${index}.css`;
						if (newName === fileName || bundle[newName] || stylesheetEntryFiles.has(fileName)) {
							renamed.add(fileName);
							continue;
						}
						// Rolldown ignores assignments to `bundle`: re-emit, then drop the original.
						this.emitFile({
							type: 'asset',
							fileName: newName,
							source: asset.source,
							originalFileName: asset.originalFileNames?.[0],
						});
						delete bundle[fileName];
						renamed.add(newName);
					}
					chunk.viteMetadata.importedCss = renamed;
				}
			},
		},
	};
}

/**
 * Toolkit 7 compiled JSX in `.js` files with Babel. Vite only parses JSX in
 * `.jsx` / `.tsx`, and `moduleTypes: { '.js': 'jsx' }` would hand JSX to
 * `wpExternals` (it runs before Rolldown's own transform). So this plugin
 * compiles JSX out of a project's `.js` files first, before every other
 * plugin sees them.
 */
export function jsxInJs() {
	return {
		name: '10up-toolkit:jsx-in-js',
		enforce: 'pre',
		async transform(code, id) {
			const [file] = id.split('?');
			if (!/\.[cm]?js$/.test(file) || file.includes('/node_modules/')) return null;
			// Cheap check: no tag-like `<X` or `</` means no JSX to compile.
			if (!/<\/|<[A-Za-z>]/.test(code)) return null;
			const result = await transformWithOxc(code, file, {
				lang: 'jsx',
				jsx: { runtime: 'automatic' },
			});
			return { code: result.code, map: result.map };
		},
	};
}

/**
 * Projects that used toolkit 7's hot reloading load `dist/fast-refresh.php`
 * and call `TenUpToolkit\set_dist_url_path()`. This shim keeps that PHP
 * working: it loads the Vite dev server bridge that `@10up/wp-vite-plugins`
 * writes, and defines the old function as a no-op.
 */
export function fastRefreshShim() {
	return {
		name: '10up-toolkit:fast-refresh-shim',
		apply: 'build',
		generateBundle() {
			this.emitFile({
				type: 'asset',
				fileName: 'fast-refresh.php',
				source: `<?php
/**
 * Generated by 10up-toolkit. Do not edit.
 *
 * Compatibility shim for themes and plugins written for 10up-toolkit 7. Load
 * dist/dev-server.php directly instead, and remove the set_dist_url_path() call.
 */

namespace TenUpToolkit;

if ( file_exists( __DIR__ . '/dev-server.php' ) ) {
	require_once __DIR__ . '/dev-server.php';
}

if ( ! function_exists( __NAMESPACE__ . '\\\\set_dist_url_path' ) ) {
	/**
	 * No-op since 10up-toolkit 8. The Vite dev server bridge finds the dist path itself.
	 *
	 * @param string $basename  Theme or plugin directory name.
	 * @param string $dist_url  Dist URL.
	 * @param string $dist_path Dist path.
	 * @return void
	 */
	function set_dist_url_path( $basename, $dist_url, $dist_path ) {} // phpcs:ignore
}
`,
			});
		},
	};
}

/**
 * The PostCSS setup toolkit 7 applied when a project had no PostCSS config:
 * global custom media/properties, mixins, `postcss-preset-env` at stage 0,
 * and the editor-styles wrapper for `editor-style.css`. Vite handles
 * `@import` and minification itself.
 */
export function defaultPostcss(paths, root) {
	const globalData = require('@csstools/postcss-global-data');
	const mixins = require('postcss-mixins');
	const presetEnv = require('postcss-preset-env');
	const editorStylesWrapper = require('postcss-editor-styles-wrapper');

	const globalCssFiles = fg.sync(`${paths.globalStylesDir}**/*.css`, {
		cwd: root,
		absolute: true,
	});
	const globalMixinFiles = fg.sync(`${paths.globalMixinsDir}**/*.css`, {
		cwd: root,
		absolute: true,
	});

	const wrapper = editorStylesWrapper({
		scopeTo: '.editor-styles-wrapper',
		ignore: [':root', '.edit-post-visual-editor.editor-styles-wrapper', '.wp-toolbar'],
		remove: ['html', ':disabled', '[readonly]', '[disabled]'],
		tags: ['button', 'input', 'label', 'select', 'textarea', 'form'],
	});

	return {
		plugins: [
			globalData({ files: globalCssFiles }),
			mixins({ mixinsFiles: globalMixinFiles }),
			presetEnv({ stage: 0, features: { 'custom-properties': false } }),
			{
				// Scope `editor-style.css` to the editor, and leave every other file alone.
				postcssPlugin: '10up-toolkit:editor-styles-wrapper',
				OnceExit(cssRoot, helpers) {
					const file = cssRoot.source?.input?.file;
					if (!file || basename(file) !== 'editor-style.css') return;
					wrapper.OnceExit(cssRoot, helpers);
				},
			},
		],
	};
}

/** Does the project carry its own PostCSS config? */
function hasPostcssConfig(root) {
	const { hasPostCSSConfig } = require('../../utils/config.js');
	return hasPostCSSConfig() || existsSync(resolve(root, 'postcss.config.mjs'));
}

/** Library (package) build: `source` / `main` in package.json. */
function packageConfig(packageBuild, project, root) {
	const { source, main, umd, style, externals, libraryName, packageType } = packageBuild;
	// `-o=dist/mjs` names a directory, `main: dist/index.js` a file.
	const mainIsFile = extname(main) !== '';
	const outDir = mainIsFile ? dirname(main) : main;
	// A library with an `entry` map in its toolkit config builds every entry
	// that exists (toolkit's default entries usually don't); otherwise `source`.
	const configuredEntries = Object.fromEntries(
		Object.entries(project.entry ?? {})
			.map(([name, file]) => [name, resolve(root, file)])
			.filter(([, file]) => existsSync(file) && !STYLE_EXTENSION.test(file)),
	);
	const entries = Object.keys(configuredEntries).length
		? configuredEntries
		: { [basename(main, extname(main))]: resolve(root, source) };

	let formats;
	if (packageType === 'umd') formats = ['umd'];
	else if (packageType === 'module') formats = ['es'];
	else if (packageType === 'none') formats = ['es'];
	else formats = ['cjs'];
	if (packageType === 'all' && umd) formats.push('umd');

	const isExternal = (id) =>
		externals.some((name) => id === name || id.startsWith(`${name}/`));

	return {
		plugins: [jsxInJs()],
		build: {
			outDir,
			emptyOutDir: false,
			sourcemap: project.sourcemap,
			cssCodeSplit: false,
			lib: {
				entry: entries,
				name: libraryName,
				formats,
				fileName: (format, entryName) => {
					if (format === 'umd' && umd) return basename(umd);
					if (Object.keys(entries).length === 1 && mainIsFile) return basename(main);
					return `${entryName}.js`;
				},
				...(style ? { cssFileName: basename(style, '.css') } : {}),
			},
			rollupOptions: {
				external: formats.includes('umd') && externals.length === 0 ? [] : isExternal,
			},
		},
	};
}

/**
 * Build the base config for one Vite invocation.
 *
 * @param {{ mode: string, command: string }} env
 * @param {{ project: object, package: object | false }} toolkitConfig
 * @param {string} root
 */
export function createBaseConfig(env, toolkitConfig, root = process.cwd()) {
	const { project } = toolkitConfig;
	const isModulePass = env.mode === 'modules';

	const shared = {
		css: hasPostcssConfig(root) ? {} : { postcss: defaultPostcss(project.paths, root) },
		...(project.publicPath ? { base: project.publicPath } : {}),
		server: {
			port: project.devServerPort,
		},
		// The dev server's up-front dependency scan parses entries raw, before
		// `jsxInJs` runs, and fails on JSX in `.js` files. Discover on demand.
		optimizeDeps: { entries: [] },
	};

	if (toolkitConfig.package) {
		return mergeConfig(shared, packageConfig(toolkitConfig.package, project, root));
	}

	const filenames = { ...project.filenames };
	if (project.useBlockAssets) {
		filenames.block = 'blocks/[name].js';
		filenames.blockCSS = 'blocks/[name].css';
	}

	const { input, cssForChunk } = resolveEntries(
		isModulePass ? project.moduleEntry : project.entry,
		filenames,
		root,
	);

	const externals =
		project.wordpress === false || project.wpDependencyExternals === false
			? false
			: { uninstalledWordPressPackages: 'external' };

	return mergeConfig(shared, {
		plugins: [
			jsxInJs(),
			wp({
				buildType: isModulePass ? 'module' : 'script',
				...(project.useBlockAssets
					? {
							blocksDir: project.paths.blocksDir,
							blocks: { emitManifest: Boolean(project.useBlockManifest) },
						}
					: { blocks: false }),
				...(project.loadBlockSpecificStyles
					? {
							blocksStylesDir: project.paths.blocksStyles,
							blockStyles: { outputPrefix: 'blocks/autoenqueue' },
						}
					: {}),
				copyAssetsDir: project.paths.copyAssetsDir,
				externals,
			}),
			entryCssNames(cssForChunk),
			fastRefreshShim(),
		],
		build: {
			outDir: 'dist',
			emptyOutDir: !isModulePass,
			sourcemap: project.sourcemap,
			rollupOptions: {
				input,
				output: {
					entryFileNames: '[name].js',
					chunkFileNames: filenames.jsChunk.replace('[contenthash]', '[hash]'),
					assetFileNames: '[name][extname]',
				},
			},
		},
	});
}

/**
 * The toolkit config, for `vite.config.*`. Pass a Vite config (or a function
 * of `{ mode, command }` returning one) to merge on top.
 *
 * @param {object | ((env: { mode: string, command: string }) => object)} [overrides]
 */
export function toolkit(overrides = {}) {
	return defineConfig((env) => {
		const base = createBaseConfig(env, readToolkitConfig());
		const extra = typeof overrides === 'function' ? overrides(env) : overrides;
		return mergeConfig(base, extra ?? {});
	});
}
