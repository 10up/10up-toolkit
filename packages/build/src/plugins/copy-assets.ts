/**
 * Copy Assets Plugin
 *
 * Copies static assets (images, fonts, etc.) to the output directory.
 */

import { copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import fastGlob from 'fast-glob';
const glob = fastGlob.sync;
import { normalizePath } from '../utils/paths.js';
import type { BuildConfig } from '../types.js';

/**
 * Asset file extensions to copy
 */
const ASSET_EXTENSIONS = [
	'jpg',
	'jpeg',
	'png',
	'gif',
	'webp',
	'avif',
	'ico',
	'svg',
	'eot',
	'ttf',
	'woff',
	'woff2',
	'otf',
];

/**
 * Copy static assets to output directory
 */
export async function copyStaticAssets(config: BuildConfig, outputDir: string): Promise<number> {
	const assetsDir = resolve(process.cwd(), config.paths.copyAssetsDir);

	if (!existsSync(assetsDir)) {
		return 0;
	}

	const pattern = `**/*.{${ASSET_EXTENSIONS.join(',')}}`;
	const assetFiles = glob(normalizePath(`${assetsDir}/${pattern}`), {
		absolute: true,
		ignore: ['**/node_modules/**'],
	});

	let copiedCount = 0;

	for (const assetPath of assetFiles) {
		// Calculate relative path from assets directory
		const relativePath = assetPath.replace(assetsDir, '').replace(/^[/\\]/, '');
		const outputPath = join(outputDir, relativePath);

		// Ensure output directory exists
		mkdirSync(dirname(outputPath), { recursive: true });

		// Copy file
		copyFileSync(assetPath, outputPath);
		copiedCount++;
	}

	return copiedCount;
}

/**
 * Check if a file is a static asset
 */
export function isAssetFile(filePath: string): boolean {
	const ext = filePath.split('.').pop()?.toLowerCase();
	return ext ? ASSET_EXTENSIONS.includes(ext) : false;
}
