/**
 * Block JSON Plugin for esbuild
 *
 * Transforms and copies block.json files to the output directory.
 * - Converts .ts/.tsx references to .js
 * - Converts .scss/.sass references to .css
 * - Adds version hash for cache busting
 */

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import fastGlob from 'fast-glob';
const glob = fastGlob.sync;
import { normalizePath, getFileContentHash } from '../utils/paths.js';
import type { BuildConfig, BlockMetadata } from '../types.js';

/**
 * Asset keys for JavaScript files
 */
const JS_ASSET_KEYS: (keyof BlockMetadata)[] = [
	'script',
	'editorScript',
	'viewScript',
	'scriptModule',
	'viewScriptModule',
];

/**
 * Asset keys for CSS files
 */
const CSS_ASSET_KEYS: (keyof BlockMetadata)[] = ['style', 'editorStyle', 'viewStyle'];

/**
 * Transform TypeScript asset paths to JavaScript
 */
function transformTSAsset(asset: string | string[]): string | string[] {
	const transform = (filePath: string): string => {
		if (!filePath.startsWith('file:')) {
			return filePath;
		}
		return filePath.replace(/\.tsx?$/, '.js');
	};

	return Array.isArray(asset) ? asset.map(transform) : transform(asset);
}

/**
 * Transform SASS/SCSS asset paths to CSS
 */
function transformSassAsset(asset: string | string[]): string | string[] {
	const transform = (filePath: string): string => {
		if (!filePath.startsWith('file:')) {
			return filePath;
		}
		return filePath.replace(/\.s[ac]ss$/, '.css');
	};

	return Array.isArray(asset) ? asset.map(transform) : transform(asset);
}

/**
 * Calculate version hash from style files
 */
function calculateStyleVersion(
	metadata: BlockMetadata,
	blockDir: string,
): string {
	const styleArrays: (string | string[])[] = [];

	if (metadata.style) styleArrays.push(metadata.style);
	if (metadata.viewStyle) styleArrays.push(metadata.viewStyle);

	let combinedHash = '';

	for (const styleField of styleArrays) {
		const styles = Array.isArray(styleField) ? styleField : [styleField];

		for (const rawStylePath of styles) {
			if (!rawStylePath.startsWith('file:')) {
				continue;
			}

			const stylePath = rawStylePath.replace('file:', '');
			const absoluteStylePath = join(blockDir, stylePath);

			if (existsSync(absoluteStylePath)) {
				combinedHash += getFileContentHash(absoluteStylePath);
			}
		}
	}

	return combinedHash ? combinedHash.slice(0, 8) : '';
}

/**
 * Transform block.json content
 */
export function transformBlockJson(content: string, absoluteFilename: string): string {
	if (!content || content.trim() === '') {
		return content;
	}

	try {
		const metadata: BlockMetadata = JSON.parse(content);
		const blockDir = dirname(absoluteFilename);

		const newMetadata: BlockMetadata = { ...metadata };

		// Add version hash if not present and has file: style references
		if (!metadata.version) {
			const versionHash = calculateStyleVersion(metadata, blockDir);
			if (versionHash) {
				newMetadata.version = versionHash;
			}
		}

		// Transform JS asset paths
		for (const key of JS_ASSET_KEYS) {
			const asset = metadata[key];
			if (asset) {
				(newMetadata as Record<string, unknown>)[key] = transformTSAsset(asset);
			}
		}

		// Transform CSS asset paths
		for (const key of CSS_ASSET_KEYS) {
			const asset = metadata[key];
			if (asset) {
				(newMetadata as Record<string, unknown>)[key] = transformSassAsset(asset);
			}
		}

		return JSON.stringify(newMetadata, null, '\t');
	} catch {
		// Return original content if parsing fails
		return content;
	}
}

/**
 * Copy and transform all block.json files to output directory
 */
export async function processBlockJsonFiles(config: BuildConfig, outputDir: string): Promise<void> {
	const blocksDir = resolve(process.cwd(), config.paths.blocksDir);

	if (!existsSync(blocksDir)) {
		return;
	}

	// Find all block.json files
	const blockJsonFiles = glob(normalizePath(`${blocksDir}/**/block.json`), {
		absolute: true,
	});

	for (const blockJsonPath of blockJsonFiles) {
		// Calculate relative path from blocks directory
		const relativePath = blockJsonPath.replace(blocksDir, '').replace(/^[/\\]/, '');
		const outputPath = join(outputDir, 'blocks', relativePath);

		// Ensure output directory exists
		mkdirSync(dirname(outputPath), { recursive: true });

		// Read, transform, and write
		const content = readFileSync(blockJsonPath, 'utf8');
		const transformed = transformBlockJson(content, blockJsonPath);
		writeFileSync(outputPath, transformed, 'utf8');
	}

	// Also copy any PHP files from blocks directory
	const phpFiles = glob(normalizePath(`${blocksDir}/**/*.php`), {
		absolute: true,
	});

	for (const phpPath of phpFiles) {
		const relativePath = phpPath.replace(blocksDir, '').replace(/^[/\\]/, '');
		const outputPath = join(outputDir, 'blocks', relativePath);

		mkdirSync(dirname(outputPath), { recursive: true });
		copyFileSync(phpPath, outputPath);
	}
}
