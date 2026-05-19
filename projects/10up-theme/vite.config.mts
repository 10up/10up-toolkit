/**
 * Vite build for 10up-theme — drop-in alternative to `10up-toolkit build`
 * used for benchmarking and validation of the POC's WP-aware plugins
 * against a real theme. Lives alongside the existing toolkit config; both
 * write to `dist/` so they're mutually exclusive at runtime.
 *
 * Run with:
 *   npm run build:vite         # both passes (script + module)
 *   npm run build:vite:scripts
 *   npm run build:vite:modules
 */
import { resolve } from 'node:path';
import { transform } from 'esbuild';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { visualizer } from 'rollup-plugin-visualizer';
import {
	wpBlocks,
	wpBlockStyles,
	wpCopyAssets,
	wpExternals,
} from '../../experiments/vite-poc/vite-plugins/index.ts';

/**
 * 10up-theme has JSX inside `.js` files (toolkit allows this via Babel).
 * Vite's `vite:build-import-analysis` runs early and parses files as plain
 * JS, choking on JSX before plugin-react-swc gets a chance to transform.
 * Run esbuild's JSX transform on `.js` files as an `enforce: 'pre'` plugin
 * so the analyzer sees plain JS. esbuild is Rust-backed (Go actually) and
 * the fast bail keeps it cheap — only ~5-10 files in this theme contain
 * JSX-in-.js.
 */
function jsxInJs(): Plugin {
	return {
		name: 'jsx-in-js',
		enforce: 'pre',
		async transform(code, id) {
			if (id.includes('/node_modules/')) return null;
			if (!/\.m?js$/.test(id.split('?')[0])) return null;
			if (!/<[A-Z]|<[a-z][\w-]*[\s/>]/.test(code)) return null;
			const result = await transform(code, {
				loader: 'jsx',
				jsx: 'automatic',
				jsxDev: false,
				sourcemap: true,
				sourcefile: id,
			});
			return { code: result.code, map: result.map };
		},
	};
}

// `import.meta.dirname` so vp's oxlint loader can parse this as pure ESM.
const themeRoot = import.meta.dirname;

function removeCssOnlyJsChunks(): Plugin {
	return {
		name: 'remove-css-only-js-chunks',
		generateBundle(_options, bundle) {
			for (const [fileName, item] of Object.entries(bundle)) {
				if (item.type !== 'chunk') continue;
				const facade = item.facadeModuleId ?? '';
				if (/\.(s?css|sass)$/.test(facade)) {
					delete bundle[fileName];
				}
			}
		},
	};
}

/**
 * IIFE-wrap script-pass entry chunks so top-level declarations don't
 * collide across enqueued <script> tags. Strips Vite's CSS-marker
 * side-effect imports first — they're invalid as classic-script syntax
 * and the CSS is enqueued separately via block.json's `style`/`editorStyle`.
 */
function iifeWrapScripts(): Plugin {
	return {
		// Wraps the chunk as the very last step before write. esbuild's
		// minifier (via `vite:esbuild-transpile`) runs as a `renderChunk`
		// hook and would inline a plain `(()=>{...})()` whose body is mostly
		// `var` declarations. `closeBundle` is too late (no chunk content);
		// `writeBundle` runs after all `renderChunk` passes and gives us the
		// file we can rewrite on disk.
		name: 'iife-wrap-scripts',
		async writeBundle(options, bundle) {
			const { readFile, writeFile } = await import('node:fs/promises');
			const { join } = await import('node:path');
			const outDir = options.dir ?? '.';

			for (const [fileName, item] of Object.entries(bundle)) {
				if (item.type !== 'chunk') continue;
				if (!fileName.endsWith('.js') && !fileName.endsWith('.mjs')) continue;
				if (!item.isEntry && !item.isDynamicEntry) continue;

				const filePath = join(outDir, fileName);
				let body = await readFile(filePath, 'utf8');

				// Strip Vite's CSS-marker side-effect imports — they're not
				// valid syntax inside a classic <script> and the CSS is
				// emitted as its own asset anyway.
				const sideEffectImport = /^\s*import\s+["'][^"']+["'];?\s*\n?/;
				while (sideEffectImport.test(body)) {
					body = body.replace(sideEffectImport, '');
				}

				await writeFile(filePath, `(()=>{\n${body}\n})();\n`);
			}
		},
	};
}

export default defineConfig(({ mode }) => {
	const isModuleBuild = mode === 'modules';
	const buildType = isModuleBuild ? 'module' : 'script';

	const plugins: (Plugin | false)[] = [
		jsxInJs(),
		wpBlocks({
			blocksDir: resolve(themeRoot, 'includes/blocks'),
			buildType,
			// Linaria + Vanilla Extract are flagged for removal in the v7 audit
			// (confirmed removals #1 + #2) and neither has a Vite equivalent
			// of the webpack loaders. Skip both — block manifest reflects
			// the remaining surface.
			skip: ['example-linaria', 'example-vanilla-extract'],
		}),
		!isModuleBuild &&
			wpBlockStyles({
				blocksStylesDir: resolve(themeRoot, 'assets/css/blocks'),
			}),
		// Mirror toolkit's CopyWebpackPlugin static pattern. Theme PHP
		// references paths like `dist/images/logo.svg` directly.
		wpCopyAssets({
			copyAssetsDir: resolve(themeRoot, 'assets'),
			buildType,
		}),
		wpExternals({
			// Metadata-driven path reads each @wordpress/* package's
			// package.json from this root to decide externalize vs bundle.
			projectRoot: themeRoot,
			buildType,
			moduleEntryMatchers: ['/view.ts', '/view.js', '/view-module.ts', '/view-module.js'],
		}),
		react({}),
		removeCssOnlyJsChunks(),
		!isModuleBuild && iifeWrapScripts(),
		// `--analyze` (via ANALYZE env) → dist-vite/stats.html treemap.
		!isModuleBuild &&
			process.env.ANALYZE &&
			(visualizer({
				filename: resolve(themeRoot, 'dist-vite/stats.html'),
				template: 'treemap',
				gzipSize: true,
				brotliSize: true,
				open: !process.env.CI,
			}) as unknown as Plugin),
	];

	// Explicit non-block entries — these come from toolkit's
	// `10up-toolkit.entry` field in package.json. `test-style` (SCSS) is
	// dropped because the project is moving to 100% PostCSS.
	const explicitEntries: Record<string, string> = isModuleBuild
		? {}
		: {
				admin: resolve(themeRoot, 'assets/js/admin/admin.js'),
				frontend: resolve(themeRoot, 'assets/js/frontend/frontend.js'),
				shared: resolve(themeRoot, 'assets/js/shared/shared.js'),
				styleguide: resolve(themeRoot, 'assets/js/styleguide/styleguide.js'),
				'admin-style': resolve(themeRoot, 'assets/css/admin/admin-style.css'),
				'editor-style': resolve(themeRoot, 'assets/css/frontend/editor-style.css'),
				'shared-style': resolve(themeRoot, 'assets/css/shared/shared-style.css'),
				'styleguide-style': resolve(themeRoot, 'assets/css/styleguide/styleguide.css'),
				'core-block-overrides': resolve(themeRoot, 'includes/core-block-overrides.js'),
			};

	return {
		root: themeRoot,
		plugins: plugins.filter((p): p is Plugin => Boolean(p)),
		resolve: {
			alias: {
				// Match toolkit's webpack alias — `lodash-es` projects can still
				// import the global `lodash` (which we externalize).
				'lodash-es': 'lodash',
			},
		},
		// Force production JSX transform — without this esbuild emits
		// `jsxDEV(...)` calls that crash WP's save serializer (the
		// `wp-react-jsx-runtime` handle only exposes `jsx`/`jsxs`).
		// SWC handles JSX-in-.js via its own parserConfig (above), so we
		// no longer need to widen esbuild's loader.
		esbuild: {
			jsxDev: false,
		},
		optimizeDeps: {
			esbuildOptions: {
				loader: { '.js': 'jsx' },
			},
		},
		build: {
			outDir: 'dist-vite', // separate from toolkit's `dist/` so we can compare both
			emptyOutDir: !isModuleBuild,
			cssCodeSplit: true,
			rollupOptions: {
				input: explicitEntries,
				output: {
					format: 'es',
					entryFileNames: '[name].js',
					chunkFileNames: 'chunks/[name]-[hash].js',
					assetFileNames: (assetInfo) => {
						if (assetInfo.name?.endsWith('.css')) {
							return '[name][extname]';
						}
						return 'assets/[name][extname]';
					},
					// IIFE wrap lives in `iifeWrapScripts()` above.
				},
			},
		},
	};
});
