/**
 * Entry point detection for WordPress blocks and build files
 */

import { readFileSync, existsSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import fastGlob from 'fast-glob';
const glob = fastGlob.sync;
import { fromProjectRoot, normalizePath } from './paths.js';
import type { BuildConfig, DetectedEntries, BlockMetadata } from '../types.js';

/**
 * Asset keys from block.json for scripts
 */
const JS_ASSET_KEYS: (keyof BlockMetadata)[] = ['script', 'editorScript', 'viewScript'];

/**
 * Asset keys from block.json for script modules
 */
const MODULE_ASSET_KEYS: (keyof BlockMetadata)[] = ['scriptModule', 'viewScriptModule'];

/**
 * Asset keys from block.json for styles
 */
const CSS_ASSET_KEYS: (keyof BlockMetadata)[] = ['style', 'editorStyle', 'viewStyle'];

/**
 * Detect all entry points for the build
 */
export async function detectEntries(config: BuildConfig): Promise<DetectedEntries> {
	const entries: DetectedEntries = {
		scripts: {},
		modules: {},
		styles: {},
	};

	// 1. Load entries from buildfiles.config.js or config.entry
	const buildFileEntries = await loadBuildFileEntries(config);
	Object.assign(entries.scripts, buildFileEntries.scripts);
	Object.assign(entries.styles, buildFileEntries.styles);

	// 2. Load module entries from config.moduleEntry
	if (config.moduleEntry && Object.keys(config.moduleEntry).length > 0) {
		Object.assign(entries.modules, filterExistingEntries(config.moduleEntry));
	}

	// 3. Detect block.json entries if useBlockAssets is enabled
	if (config.useBlockAssets) {
		const blockEntries = detectBlockEntries(config);
		Object.assign(entries.scripts, blockEntries.scripts);
		Object.assign(entries.modules, blockEntries.modules);
		Object.assign(entries.styles, blockEntries.styles);
	}

	return entries;
}

/**
 * Load entries from buildfiles.config.js or config.entry
 */
async function loadBuildFileEntries(
	config: BuildConfig,
): Promise<{ scripts: Record<string, string>; styles: Record<string, string> }> {
	const result: { scripts: Record<string, string>; styles: Record<string, string> } = {
		scripts: {},
		styles: {},
	};

	// Try buildfiles.config.js first
	const buildFilesConfigPath = fromProjectRoot('buildfiles.config.js');
	let entries: Record<string, string> = {};

	if (existsSync(buildFilesConfigPath)) {
		try {
			const buildFilesModule = await import(`file://${buildFilesConfigPath}`);
			entries = buildFilesModule.default || buildFilesModule;
		} catch (error) {
			console.warn(
				'Warning: Could not load buildfiles.config.js:',
				error instanceof Error ? error.message : error,
			);
		}
	} else if (config.entry && Object.keys(config.entry).length > 0) {
		// Use config.entry as fallback
		entries = config.entry;
	}

	// Separate JS and CSS entries, adding js/ and css/ prefixes for output organization
	for (const [name, filePath] of Object.entries(entries)) {
		const resolvedPath = fromProjectRoot(filePath);

		if (!existsSync(resolvedPath)) {
			continue;
		}

		const ext = extname(filePath).toLowerCase();

		if (['.css', '.scss', '.sass'].includes(ext)) {
			// CSS entries go to css/ subdirectory
			result.styles[`css/${name}`] = resolvedPath;
		} else {
			// JS entries go to js/ subdirectory
			result.scripts[`js/${name}`] = resolvedPath;
		}
	}

	return result;
}

/**
 * Filter entries to only include existing files, adding js/ prefix for output organization
 */
function filterExistingEntries(entries: Record<string, string>): Record<string, string> {
	const result: Record<string, string> = {};

	for (const [name, filePath] of Object.entries(entries)) {
		const resolvedPath = fromProjectRoot(filePath);
		if (existsSync(resolvedPath)) {
			// Add js/ prefix for module entries
			result[`js/${name}`] = resolvedPath;
		}
	}

	return result;
}

/**
 * Detect entries from block.json files
 */
function detectBlockEntries(config: BuildConfig): DetectedEntries {
	const result: DetectedEntries = { scripts: {}, modules: {}, styles: {} };

	const blocksDir = resolve(process.cwd(), config.paths.blocksDir);

	if (!existsSync(blocksDir)) {
		return result;
	}

	// Find all block.json files
	const blockMetadataFiles = glob(normalizePath(`${blocksDir}/**/block.json`), {
		absolute: true,
	});

	for (const blockMetadataFile of blockMetadataFiles) {
		try {
			const metadata: BlockMetadata = JSON.parse(readFileSync(blockMetadataFile, 'utf8'));
			const blockDir = dirname(blockMetadataFile);

			// Process script assets
			for (const key of JS_ASSET_KEYS) {
				const asset = metadata[key];
				if (asset) {
					const entries = processAssetField(asset, blockDir, blocksDir, false);
					Object.assign(result.scripts, entries);
				}
			}

			// Process script module assets
			for (const key of MODULE_ASSET_KEYS) {
				const asset = metadata[key];
				if (asset) {
					const entries = processAssetField(asset, blockDir, blocksDir, false);
					Object.assign(result.modules, entries);
				}
			}

			// Process style assets
			for (const key of CSS_ASSET_KEYS) {
				const asset = metadata[key];
				if (asset) {
					const entries = processAssetField(asset, blockDir, blocksDir, true);
					Object.assign(result.styles, entries);
				}
			}
		} catch (error) {
			// Skip malformed block.json files
			console.warn(
				`Warning: Could not parse ${blockMetadataFile}:`,
				error instanceof Error ? error.message : error,
			);
		}
	}

	return result;
}

/**
 * Process an asset field from block.json
 */
function processAssetField(
	asset: string | string[],
	blockDir: string,
	blocksDir: string,
	isStyle: boolean,
): Record<string, string> {
	const result: Record<string, string> = {};
	const assets = Array.isArray(asset) ? asset : [asset];

	for (const rawFilepath of assets) {
		// Only process file: prefixed paths
		if (!rawFilepath || !rawFilepath.startsWith('file:')) {
			continue;
		}

		const relativePath = rawFilepath.replace('file:', '');
		const targetPath = join(blockDir, relativePath);

		// Generate entry name from path
		const entryName = targetPath
			.replace(extname(targetPath), '')
			.replace(blocksDir, '')
			.replace(/^[/\\]/, '');

		// Find the actual source file (might be .ts, .tsx, .scss, etc.)
		const sourceFile = findSourceFile(targetPath, isStyle);

		if (sourceFile) {
			result[`blocks/${normalizePath(entryName)}`] = sourceFile;
		}
	}

	return result;
}

/**
 * Find the actual source file for a target path
 */
function findSourceFile(targetPath: string, isStyle: boolean): string | null {
	const dir = dirname(targetPath);
	const baseName = targetPath
		.replace(extname(targetPath), '')
		.replace(dir, '')
		.replace(/^[/\\]/, '');

	const extensions = isStyle ? ['.css', '.scss', '.sass'] : ['.js', '.jsx', '.ts', '.tsx'];

	for (const ext of extensions) {
		const sourcePath = join(dir, `${baseName}${ext}`);
		if (existsSync(sourcePath)) {
			return sourcePath;
		}
	}

	// Try the exact path
	if (existsSync(targetPath)) {
		return targetPath;
	}

	return null;
}

/**
 * Get block-specific style entries (for loadBlockSpecificStyles option)
 */
export function getBlockSpecificStyles(config: BuildConfig): Record<string, string> {
	const result: Record<string, string> = {};

	const stylesDir = resolve(process.cwd(), config.paths.blocksStyles);

	if (!existsSync(stylesDir)) {
		return result;
	}

	const stylesheets = glob(normalizePath(`${stylesDir}/**/*.{css,scss,sass}`), {
		absolute: true,
	});

	for (const filePath of stylesheets) {
		const blockName = filePath.replace(`${stylesDir}/`, '').replace(extname(filePath), '');

		result[`autoenqueue/${normalizePath(blockName)}`] = filePath;
	}

	return result;
}
