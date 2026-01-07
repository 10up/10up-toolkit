/**
 * Configuration loading for @10up/build
 *
 * This module handles loading and merging configuration from multiple sources:
 * 1. Default configuration values
 * 2. `package.json["10up-toolkit"]` field
 * 3. Configuration files (buildfiles.config.js, postcss.config.js)
 *
 * @packageDocumentation
 * @module config
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fromProjectRoot, fromPackageRoot } from './utils/paths.js';
import type { BuildConfig, PathsConfig, FilenamesConfig, PostCSSConfig } from './types.js';

/**
 * Default paths configuration.
 *
 * These defaults follow the 10up-toolkit convention for WordPress
 * theme and plugin development.
 */
const defaultPaths: PathsConfig = {
	blocksDir: './includes/blocks/',
	distDir: './dist/',
	srcDir: './assets/',
	copyAssetsDir: './assets/',
	blocksStyles: './assets/css/blocks/',
	globalStylesDir: './assets/css/globals/',
	globalMixinsDir: './assets/css/mixins/',
};

/**
 * Default filenames configuration.
 *
 * Uses esbuild-style placeholders for output naming.
 */
const defaultFilenames: FilenamesConfig = {
	js: 'js/[name].js',
	jsChunk: 'js/[name].[contenthash].chunk.js',
	css: 'css/[name].css',
	block: 'blocks/[name].js',
	blockCSS: 'blocks/[name].css',
};

/**
 * Default configuration values.
 *
 * These values are used when not overridden by user configuration.
 * The configuration schema is designed to be compatible with
 * 10up-toolkit's configuration format.
 *
 * @example
 * ```typescript
 * import { defaultConfig } from '@10up/build/config';
 * console.log(defaultConfig.wpDependencyExternals); // true
 * ```
 */
export const defaultConfig: BuildConfig = {
	// Entry points
	entry: {},
	moduleEntry: {},

	// Paths
	paths: defaultPaths,

	// Output filenames
	filenames: defaultFilenames,

	// Features
	useBlockAssets: false,
	useScriptModules: false,
	wpDependencyExternals: true,
	loadBlockSpecificStyles: false,

	// Development
	hot: false,
	devServerPort: 8887,
	devURL: '',

	// Build options
	sourcemap: false,
	publicPath: '/dist/',

	// External namespaces for custom packages
	externalNamespaces: {},
};

/**
 * Load and merge configuration from all sources.
 *
 * Configuration is loaded in the following order (later sources override earlier):
 * 1. Default configuration
 * 2. `package.json["10up-toolkit"]` field
 * 3. PostCSS configuration file detection
 *
 * @returns Merged build configuration
 *
 * @example
 * ```typescript
 * import { loadConfig } from '@10up/build';
 *
 * const config = loadConfig();
 * console.log(config.paths.blocksDir); // "./includes/blocks/"
 * ```
 */
export function loadConfig(): BuildConfig {
	const projectPackageJson = loadProjectPackageJson();
	const toolkitConfig = (projectPackageJson?.['10up-toolkit'] || {}) as Partial<BuildConfig>;

	// Deep merge paths
	const paths: PathsConfig = {
		...defaultPaths,
		...(toolkitConfig.paths || {}),
	};

	// Deep merge filenames
	const filenames: FilenamesConfig = {
		...defaultFilenames,
		...(toolkitConfig.filenames || {}),
	};

	// Merge all config
	const config: BuildConfig = {
		...defaultConfig,
		...toolkitConfig,
		paths,
		filenames,
	};

	// Load additional config files
	config.postcss = loadPostcssConfig(config);

	return config;
}

/**
 * Load the project's package.json file.
 *
 * Reads and parses the package.json from the current working directory.
 *
 * @returns Parsed package.json content, or null if not found/invalid
 *
 * @internal
 */
function loadProjectPackageJson(): Record<string, unknown> | null {
	const packageJsonPath = fromProjectRoot('package.json');

	if (!existsSync(packageJsonPath)) {
		return null;
	}

	try {
		return JSON.parse(readFileSync(packageJsonPath, 'utf8'));
	} catch {
		return null;
	}
}

/**
 * Load PostCSS configuration.
 *
 * Checks for a postcss.config.js in the project root.
 * If not found, uses the default configuration with global styles and mixins.
 *
 * @param config - Current build configuration (for path resolution)
 * @returns PostCSS configuration object
 *
 * @internal
 */
function loadPostcssConfig(config: BuildConfig): PostCSSConfig {
	// Check for project postcss.config.js
	const projectPostcssPath = fromProjectRoot('postcss.config.js');

	if (existsSync(projectPostcssPath)) {
		return { configPath: projectPostcssPath };
	}

	// Use default postcss config
	return {
		configPath: fromPackageRoot('config/postcss.config.js'),
		globalStylesDir: resolve(process.cwd(), config.paths.globalStylesDir),
		globalMixinsDir: resolve(process.cwd(), config.paths.globalMixinsDir),
	};
}

/**
 * Check if a configuration file exists in the project root.
 *
 * @param filename - Name of the configuration file to check
 * @returns True if the file exists
 *
 * @example
 * ```typescript
 * if (hasConfigFile('postcss.config.js')) {
 *   console.log('Using custom PostCSS configuration');
 * }
 * ```
 */
export function hasConfigFile(filename: string): boolean {
	return existsSync(fromProjectRoot(filename));
}

/**
 * Get the output directory path.
 *
 * Returns the absolute path to the dist directory where
 * compiled assets will be written.
 *
 * @param config - Build configuration
 * @returns Absolute path to the output directory
 *
 * @example
 * ```typescript
 * const outputDir = getOutputDir(config);
 * console.log(outputDir); // "/path/to/project/dist"
 * ```
 */
export function getOutputDir(config: BuildConfig): string {
	return fromProjectRoot(config.paths.distDir);
}

/**
 * Check if the build is running in production mode.
 *
 * Production mode is determined by `NODE_ENV=production`.
 * In production mode:
 * - Output is minified
 * - Source maps are disabled (unless explicitly enabled)
 * - Console output is optimized
 *
 * @returns True if NODE_ENV is "production"
 *
 * @example
 * ```typescript
 * if (isProduction()) {
 *   console.log('Building for production...');
 * }
 * ```
 */
export function isProduction(): boolean {
	return process.env.NODE_ENV === 'production';
}

/**
 * Check if the build is running in watch mode.
 *
 * Watch mode is detected from command-line arguments.
 *
 * @returns True if --watch flag is present or command is "start"
 */
export function isWatchMode(): boolean {
	return process.argv.includes('--watch') || process.argv.includes('start');
}
