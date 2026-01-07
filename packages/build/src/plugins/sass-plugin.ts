/**
 * SASS/SCSS Plugin for esbuild
 *
 * Compiles SCSS files using the sass package,
 * then processes with PostCSS and lightningcss.
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve, extname } from 'node:path';
import * as sass from 'sass';
import postcss from 'postcss';
// @ts-expect-error - postcss-import doesn't have types
import postcssImport from 'postcss-import';
// @ts-expect-error - postcss-mixins doesn't have types
import postcssMixins from 'postcss-mixins';
// @ts-ignore - @csstools/postcss-global-data doesn't have types
import postcssGlobalData from '@csstools/postcss-global-data';
// @ts-ignore - postcss-custom-media doesn't have types
import postcssCustomMedia from 'postcss-custom-media';
import { transform, browserslistToTargets } from 'lightningcss';
import fastGlob from 'fast-glob';
const glob = fastGlob.sync;
import type { Plugin, OnLoadArgs, OnLoadResult } from 'esbuild';
import { normalizePath } from '../utils/paths.js';
import type { BuildConfig } from '../types.js';

/**
 * Default browser targets for lightningcss
 */
const defaultTargets = browserslistToTargets([
	'> 1%',
	'last 2 versions',
	'Firefox ESR',
	'not dead',
]);

/**
 * Create the SASS plugin for esbuild
 */
export function sassPlugin(config: BuildConfig, isProduction: boolean): Plugin {
	return {
		name: 'sass',

		setup(build) {
			// Handle .scss and .sass files
			build.onLoad({ filter: /\.s[ac]ss$/ }, async (args: OnLoadArgs): Promise<OnLoadResult> => {
				try {
					// Compile SCSS to CSS
					const sassResult = sass.compile(args.path, {
						loadPaths: [dirname(args.path), 'node_modules'],
						sourceMap: !isProduction,
						style: isProduction ? 'compressed' : 'expanded',
					});

					let css = sassResult.css;

					// Process with PostCSS
					css = await processWithPostCSS(css, args.path, config);

					// Process with lightningcss for modern CSS features and minification
					css = processWithLightningCSS(css, args.path, isProduction);

					return {
						contents: css,
						loader: 'css',
						watchFiles: sassResult.loadedUrls
							.filter((url) => url.protocol === 'file:')
							.map((url) => url.pathname),
					};
				} catch (error) {
					return {
						errors: [
							{
								text: error instanceof Error ? error.message : String(error),
								location: { file: args.path },
							},
						],
					};
				}
			});

			// Handle regular .css files (also process with PostCSS and lightningcss)
			build.onLoad({ filter: /\.css$/ }, async (args: OnLoadArgs): Promise<OnLoadResult> => {
				// Skip if this is a CSS module or already processed
				if (args.path.includes('.module.') || args.namespace !== 'file') {
					return { loader: 'css' };
				}

				try {
					let css = readFileSync(args.path, 'utf8');

					// Process with PostCSS
					css = await processWithPostCSS(css, args.path, config);

					// Process with lightningcss
					css = processWithLightningCSS(css, args.path, isProduction);

					return {
						contents: css,
						loader: 'css',
					};
				} catch (error) {
					return {
						errors: [
							{
								text: error instanceof Error ? error.message : String(error),
								location: { file: args.path },
							},
						],
					};
				}
			});
		},
	};
}

/**
 * Process CSS with PostCSS plugins
 */
async function processWithPostCSS(
	css: string,
	filePath: string,
	config: BuildConfig,
): Promise<string> {
	const plugins: postcss.AcceptedPlugin[] = [postcssImport()];

	// Add global data plugin if global styles exist
	const globalStylesDir = resolve(process.cwd(), config.paths.globalStylesDir);
	const globalCssFiles = glob(normalizePath(`${globalStylesDir}/**/*.css`));

	if (globalCssFiles.length > 0) {
		plugins.push(postcssGlobalData({ files: globalCssFiles }));
	}

	// Add custom media plugin to transform @custom-media queries
	// This must come after postcssGlobalData which makes the definitions available
	plugins.push(postcssCustomMedia());

	// Add mixins plugin if mixin files exist
	const globalMixinsDir = resolve(process.cwd(), config.paths.globalMixinsDir);
	const globalMixinFiles = glob(normalizePath(`${globalMixinsDir}/**/*.css`));

	if (globalMixinFiles.length > 0) {
		plugins.push(postcssMixins({ mixinsFiles: globalMixinFiles }));
	}

	const result = await postcss(plugins).process(css, {
		from: filePath,
		to: filePath,
	});

	return result.css;
}

/**
 * Process CSS with lightningcss for modern features and minification
 */
function processWithLightningCSS(css: string, filePath: string, isProduction: boolean): string {
	const { code } = transform({
		filename: filePath,
		code: Buffer.from(css),
		minify: isProduction,
		sourceMap: !isProduction,
		targets: defaultTargets,
		// Note: customMedia is handled by postcss-custom-media in the PostCSS phase
	});

	return code.toString();
}

/**
 * Get file extension
 */
export function isStyleFile(filePath: string): boolean {
	const ext = extname(filePath).toLowerCase();
	return ['.css', '.scss', '.sass'].includes(ext);
}
