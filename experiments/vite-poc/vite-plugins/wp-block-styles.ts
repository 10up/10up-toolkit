/**
 * vite-plugin-wp-block-styles
 *
 * Reproduces toolkit's `loadBlockSpecificStyles` behavior: every stylesheet
 * under `blocksStylesDir` becomes its own entry, so each gets a dedicated
 * CSS file in dist that PHP can selectively enqueue per block.
 *
 * Source: `assets/css/blocks/<block-name>/<file>.scss`
 * Output: `dist/autoenqueue/<block-name>/<file>.css`
 */
import { extname, resolve, relative } from 'node:path';
import fg from 'fast-glob';
import type { Plugin } from 'vite';

export interface WpBlockStylesOptions {
	blocksStylesDir: string;
}

export function wpBlockStyles(options: WpBlockStylesOptions): Plugin {
	let stylesDirAbs: string;

	return {
		name: 'wp-block-styles',
		enforce: 'pre',

		config() {
			stylesDirAbs = resolve(process.cwd(), options.blocksStylesDir);

			const stylesheets = fg.sync(
				`${stylesDirAbs.replace(/\\/g, '/')}/**/*.{css,scss,sass}`,
				{ absolute: true },
			);

			const entries: Record<string, string> = {};
			for (const filePath of stylesheets) {
				const blockName = relative(stylesDirAbs, filePath)
					.replace(extname(filePath), '')
					.replace(/\\/g, '/');
				entries[`autoenqueue/${blockName}`] = filePath;
			}

			return {
				build: {
					rollupOptions: {
						input: entries,
					},
				},
			};
		},
	};
}
