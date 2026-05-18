/**
 * vite-plugin-wp-copy-assets
 *
 * Mirrors toolkit's CopyWebpackPlugin static-asset pattern: copies
 * `assets/**` to `dist/` so theme/plugin PHP can reference paths like
 * `dist/images/logo.svg` even though those files never pass through the
 * bundler.
 *
 * Default pattern matches toolkit exactly:
 *   `**\/*.{jpg,jpeg,png,gif,webp,avif,ico,svg,eot,ttf,woff,woff2,otf}`
 *
 * Path semantics also match: a file at `<copyAssetsDir>/images/logo.svg`
 * lands at `dist/images/logo.svg` (the `copyAssetsDir` is the "context",
 * and the relative subpath is preserved).
 */
import { readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import fg from 'fast-glob';
import type { Plugin } from 'vite';

const DEFAULT_PATTERN =
	'**/*.{jpg,jpeg,png,gif,webp,avif,ico,svg,eot,ttf,woff,woff2,otf}';

export interface WpCopyAssetsOptions {
	/** Source directory (default: `./assets`). Toolkit's `paths.copyAssetsDir`. */
	copyAssetsDir: string;
	/** Override the glob pattern (relative to `copyAssetsDir`). */
	pattern?: string;
	/** Only run during the script pass — module pass would emit duplicates. */
	buildType?: 'script' | 'module';
}

export function wpCopyAssets(options: WpCopyAssetsOptions): Plugin {
	const pattern = options.pattern ?? DEFAULT_PATTERN;
	const buildType = options.buildType ?? 'script';
	let copyDirAbs: string;

	return {
		name: `wp-copy-assets(${buildType})`,
		enforce: 'pre',

		config() {
			copyDirAbs = resolve(process.cwd(), options.copyAssetsDir);
		},

		async generateBundle() {
			// Module pass would write the same files a second time; skip.
			if (buildType !== 'script') return;

			const matches = await fg(pattern, {
				cwd: copyDirAbs,
				absolute: true,
				onlyFiles: true,
			});

			for (const file of matches) {
				const rel = relative(copyDirAbs, file).replace(/\\/g, '/');
				this.emitFile({
					type: 'asset',
					fileName: rel,
					source: readFileSync(file),
				});
			}
		},
	};
}
