/**
 * 10up-build - esbuild-powered WordPress build tool
 *
 * @packageDocumentation
 */

// Main exports
export { build } from './build.js';
export { watch } from './watch.js';
export { cli } from './cli.js';
export { loadConfig, defaultConfig, isProduction, isWatchMode } from './config.js';

// Type exports
export type {
	BuildConfig,
	PathsConfig,
	FilenamesConfig,
	ExternalNamespaceConfig,
	PostCSSConfig,
	DetectedEntries,
	BuildResult,
	WatchOptions,
	BlockMetadata,
	DependencyInfo,
} from './types.js';

// Utility exports
export { detectEntries, getBlockSpecificStyles } from './utils/entry-detection.js';
export {
	resolveExternal,
	isWpScriptPackage,
	wpPackageToHandle,
	wpPackageToGlobal,
	vendorExternals,
} from './utils/externals.js';
export {
	fromProjectRoot,
	fromPackageRoot,
	hasProjectFile,
	fileExists,
	getContentHash,
	getFileContentHash,
	normalizePath,
} from './utils/paths.js';

// Plugin exports
export { wpDependencyExtractionPlugin } from './plugins/wp-dependency-extraction.js';
export { sassPlugin } from './plugins/sass-plugin.js';
export { transformBlockJson, processBlockJsonFiles } from './plugins/block-json.js';
export { copyStaticAssets } from './plugins/copy-assets.js';
