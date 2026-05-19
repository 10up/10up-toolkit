import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { visualizer } from 'rollup-plugin-visualizer';
import { wpBlocks, wpBlockStyles, wpCopyAssets, wpExternals } from './vite-plugins/index.ts';

// `import.meta.dirname` (Node 20.11+) instead of `__dirname` — vp's oxlint
// loads this file as pure ESM where `__dirname` isn't defined.
const fixtureRoot = resolve(import.meta.dirname, 'fixture-plugin');

/**
 * After a CSS-only entry (e.g. `blocks/hello/style.css`) is processed,
 * Rollup leaves behind a near-empty JS wrapper next to the emitted CSS.
 * Drop those wrappers so dist only contains the CSS we actually want.
 * Mirrors RemoveEmptyScriptsPlugin from the webpack side of toolkit.
 */
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
 * Wrap each script-pass entry chunk in an IIFE so top-level declarations
 * don't collide across enqueued <script> tags. Has to run as `renderChunk`
 * (not `output.intro`) because Vite leaves side-effect CSS marker imports
 * like `import "./editor.js";` at the top of chunks that imported a CSS
 * file — those imports stay above the IIFE (or get stripped here, since
 * they're invalid in a classic <script> anyway and the CSS is already
 * extracted to its own .css file enqueued via block.json's `style` field).
 */
function iifeWrapScripts(): Plugin {
	return {
		// Wraps the chunk as the very last step before write. esbuild's
		// minifier runs as a `renderChunk` hook and would inline a plain
		// `(()=>{...})()` whose body is mostly `var` declarations. Running
		// in `writeBundle` is after all `renderChunk` passes.
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

				const sideEffectImport = /^\s*import\s+["'][^"']+["'];?\s*\n?/;
				while (sideEffectImport.test(body)) {
					body = body.replace(sideEffectImport, '');
				}

				await writeFile(filePath, `(()=>{\n${body}\n})();\n`);
			}
		},
	};
}

/**
 * Mode-aware config. Run with:
 *
 *   vite build                  → script pass (default)
 *   vite build --mode modules   → module pass (Script Modules / Interactivity API)
 *
 * Both write to fixture-plugin/dist. `emptyOutDir` only fires on the script
 * pass so the module pass is purely additive. `npm run build` runs both in
 * sequence; see package.json.
 */
export default defineConfig(({ mode }) => {
	const isModuleBuild = mode === 'modules';
	const buildType = isModuleBuild ? 'module' : 'script';

	const plugins = [
		wpBlocks({
			blocksDir: resolve(fixtureRoot, 'blocks'),
			buildType,
			emitManifest: true, // #475 — blocks-manifest.php (only emitted in script pass)
		}),
		// CSS-only auto-enqueue has no module-mode story; skip in the module pass.
		!isModuleBuild &&
			wpBlockStyles({
				blocksStylesDir: resolve(fixtureRoot, 'assets/css/blocks'),
			}),
		// Static-asset mirror — images/fonts/svg from assets/ into dist/.
		// Module pass skips (would duplicate); the plugin self-guards too.
		wpCopyAssets({
			copyAssetsDir: resolve(fixtureRoot, 'assets'),
			buildType,
		}),
		wpExternals({
			// Metadata-driven path reads each @wordpress/* package's
			// package.json from this root to decide externalize vs bundle.
			projectRoot: import.meta.dirname,
			buildType,
			// `view.ts` / `view-module.ts` files are Script Module entries
			// regardless of the plugin's overall buildType. Keeps their ESM
			// imports intact in dev mode (single-Vite-process serves) so the
			// browser resolves them via WP's import map, where window.wp.*
			// globals don't exist on the frontend.
			moduleEntryMatchers: ['/view.ts', '/view.js', '/view-module.ts', '/view-module.js'],
		}),
		react({}),
		removeCssOnlyJsChunks(),
		!isModuleBuild && iifeWrapScripts(),
		// Bundle-size visualizer — emits dist/stats.html (treemap by
		// default) when ANALYZE=1 is set. Matches the role of toolkit's
		// `--analyze` (webpack-bundle-analyzer). Script pass only so the
		// two passes don't overwrite each other's reports.
		!isModuleBuild &&
			process.env.ANALYZE &&
			(visualizer({
				filename: resolve(fixtureRoot, 'dist/stats.html'),
				template: 'treemap',
				gzipSize: true,
				brotliSize: true,
				open: !process.env.CI,
			}) as unknown as Plugin),
	];

	const seedInputs: Record<string, string> = isModuleBuild
		? {}
		: { 'admin/index': resolve(fixtureRoot, 'admin/index.ts') };

	return {
		root: fixtureRoot,
		plugins: plugins.filter(Boolean) as Plugin[],
		// Vite+'s docs describe a `lint.options.typeCheck` block here, but
		// vp 0.1.21's function-form-config loader doesn't pick it up — we
		// pass `--type-aware --type-check` on the CLI instead (see the
		// `typecheck:vp` npm script). Leaving this note so future bumps
		// can switch back to the in-config form.
		// Force the production JSX transform. Without this, esbuild emits
		// `jsxDEV(...)` calls in `vite build` output — and WP's registered
		// `wp-react-jsx-runtime` only exposes `jsx`/`jsxs` (no `jsxDEV`), so
		// the block editor's save serializer crashes when it can't find
		// `jsxDEV` on the global.
		esbuild: {
			jsxDev: false,
		},
		build: {
			outDir: 'dist',
			emptyOutDir: !isModuleBuild,
			cssCodeSplit: true,
			rollupOptions: {
				input: seedInputs,
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
					// IIFE wrap for script-pass chunks lives in the
					// `iifeWrapScripts()` plugin above — has to run as
					// renderChunk so it can strip Vite's CSS-marker imports
					// before wrapping.
				},
			},
		},
		server: {
			port: 5173,
			strictPort: false,
			// The fast-refresh.php bridge wires WP to load scripts from the
			// dev server. CORS has to be permissive so the editor iframe
			// (different origin) can fetch them. `host: true` exposes the
			// server on the network for Docker/wp-env WP installs.
			cors: true,
			host: true,
		},
	};
});
