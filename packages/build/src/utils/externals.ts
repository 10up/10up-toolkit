/**
 * WordPress and vendor externals handling
 *
 * Uses dynamic detection via wpScript flag in package.json
 * instead of maintaining a hardcoded list.
 *
 * Supports a cache file (.wp-scripts-cache.json) for CI environments
 * where optional dependencies are not installed.
 */

import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
import type { BuildConfig, ExternalResolution } from '../types.js';

const require = createRequire(import.meta.url);

/**
 * Vendor externals - these don't have wpScript flag
 * so we maintain them as a hardcoded list
 */
export const vendorExternals: Record<string, ExternalResolution> = {
	react: { global: 'React', handle: 'react' },
	'react-dom': { global: 'ReactDOM', handle: 'react-dom' },
	'react-dom/client': { global: 'ReactDOM', handle: 'react-dom' },
	'react/jsx-runtime': { global: 'ReactJSXRuntime', handle: 'react-jsx-runtime' },
	lodash: { global: 'lodash', handle: 'lodash' },
	'lodash-es': { global: 'lodash', handle: 'lodash' },
	moment: { global: 'moment', handle: 'moment' },
	jquery: { global: 'jQuery', handle: 'jquery' },
};

/**
 * Cache file name for wpScript lookups
 */
export const WP_SCRIPTS_CACHE_FILE = '.wp-scripts-cache.json';

/**
 * Cache for package.json wpScript lookups (runtime cache)
 */
const wpScriptCache = new Map<string, boolean>();

/**
 * File-based cache loaded from .wp-scripts-cache.json
 */
let fileCache: Record<string, boolean> | null = null;
let fileCacheLoaded = false;

/**
 * Find the cache file by searching up the directory tree.
 * This allows workspace packages in a monorepo to find the cache
 * file at the monorepo root.
 */
function findCacheFile(startDir: string): string | null {
	let dir = startDir;

	while (dir !== dirname(dir)) {
		const cachePath = join(dir, WP_SCRIPTS_CACHE_FILE);
		if (existsSync(cachePath)) {
			return cachePath;
		}
		dir = dirname(dir);
	}

	return null;
}

/**
 * Load the wpScript cache from file if it exists.
 * Searches up the directory tree to find the cache file,
 * supporting monorepo setups where the cache is at the root.
 */
function loadFileCache(): Record<string, boolean> | null {
	if (fileCacheLoaded) {
		return fileCache;
	}

	fileCacheLoaded = true;

	const cachePath = findCacheFile(process.cwd());
	if (cachePath) {
		try {
			const cacheData = JSON.parse(readFileSync(cachePath, 'utf8'));
			if (cacheData && typeof cacheData.packages === 'object') {
				fileCache = cacheData.packages;
				return fileCache;
			}
		} catch {
			// Invalid cache file, ignore
		}
	}

	return null;
}

/**
 * Result of checking a WordPress package
 */
interface WpPackageCheckResult {
	/** Whether the package should be externalized */
	isExternal: boolean;
	/** Whether the package was found/installed locally */
	isInstalled: boolean;
}

/**
 * Check if a @wordpress/* package has wpScript: true
 * Returns:
 * - isExternal: true if package should be externalized (wpScript: true or not installed)
 * - isInstalled: true if package was found in node_modules
 *
 * This ensures we externalize all @wordpress/* imports, even if
 * the package isn't a direct dependency of the project.
 *
 * Resolution order:
 * 1. Runtime cache (fastest)
 * 2. File-based cache (.wp-scripts-cache.json) - for CI without optional deps
 * 3. Package.json lookup (when package is installed)
 * 4. Default to true (externalize) if package not found
 *
 * @param packageName - The @wordpress/* package name to check
 * @returns Object with isExternal and isInstalled flags
 */
export function isWpScriptPackage(packageName: string): WpPackageCheckResult {
	// 1. Check runtime cache first
	const cached = wpScriptCache.get(packageName);
	if (cached !== undefined) {
		// For cached results, we can't determine isInstalled from boolean
		// So we need to try resolving again
	}

	// 2. Try to resolve from installed package
	try {
		const pkgJsonPath = require.resolve(`${packageName}/package.json`);
		const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));

		// If wpScript is explicitly set, use that value
		if (typeof pkgJson.wpScript === 'boolean') {
			wpScriptCache.set(packageName, pkgJson.wpScript);
			return { isExternal: pkgJson.wpScript, isInstalled: true };
		}

		// wpScript is undefined - check file cache for authoritative answer
		const fileCacheData = loadFileCache();
		if (fileCacheData && packageName in fileCacheData) {
			const hasWpScript = fileCacheData[packageName];
			wpScriptCache.set(packageName, hasWpScript);
			return { isExternal: hasWpScript, isInstalled: true };
		}

		// Not in cache either - default to NOT externalizing installed packages without wpScript
		wpScriptCache.set(packageName, false);
		return { isExternal: false, isInstalled: true };
	} catch {
		// Package not installed or subpath export - check file cache and parent package
	}

	// 3. Check file-based cache (.wp-scripts-cache.json)
	const fileCacheData = loadFileCache();
	if (fileCacheData && packageName in fileCacheData) {
		const hasWpScript = fileCacheData[packageName];
		wpScriptCache.set(packageName, hasWpScript);
		return { isExternal: hasWpScript, isInstalled: false };
	}

	// 4. For subpath exports like @wordpress/dataviews/wp, check the parent package
	const parts = packageName.replace('@wordpress/', '').split('/');
	if (parts.length > 1) {
		const parentPackage = `@wordpress/${parts[0]}`;

		// Check parent in file cache
		if (fileCacheData && parentPackage in fileCacheData) {
			const parentHasWpScript = fileCacheData[parentPackage];
			wpScriptCache.set(packageName, parentHasWpScript);
			return { isExternal: parentHasWpScript, isInstalled: false };
		}

		// Try to resolve parent package
		try {
			const parentPkgJsonPath = require.resolve(`${parentPackage}/package.json`);
			const parentPkgJson = JSON.parse(readFileSync(parentPkgJsonPath, 'utf8'));
			const parentHasWpScript = typeof parentPkgJson.wpScript === 'boolean'
				? parentPkgJson.wpScript
				: false;
			wpScriptCache.set(packageName, parentHasWpScript);
			return { isExternal: parentHasWpScript, isInstalled: true };
		} catch {
			// Parent also not found
		}
	}

	// 5. Package not installed and not in cache - assume it should be externalized
	// since all @wordpress/* packages with wpScript=true are
	// available as WordPress globals at runtime
	wpScriptCache.set(packageName, true);
	return { isExternal: true, isInstalled: false };
}

/**
 * Convert a string to camelCase
 */
function camelCase(str: string): string {
	return str.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

/**
 * Convert @wordpress/* package name to WP script handle
 * @example '@wordpress/blocks' -> 'wp-blocks'
 */
export function wpPackageToHandle(packageName: string): string {
	return packageName.replace('@wordpress/', 'wp-');
}

/**
 * Convert @wordpress/* package name to global variable path
 * @example '@wordpress/blocks' -> 'wp.blocks'
 */
export function wpPackageToGlobal(packageName: string): string {
	const name = packageName.replace('@wordpress/', '');
	return `wp.${camelCase(name)}`;
}

/**
 * Resolve external configuration for a package
 *
 * @param packageName - The package name to resolve
 * @param config - Build configuration with external namespaces
 * @returns External resolution with global and handle, or null if not external
 */
export function resolveExternal(
	packageName: string,
	config: Partial<BuildConfig> = {},
): ExternalResolution | null {
	// 1. Check @wordpress/* packages (read wpScript from package.json)
	if (packageName.startsWith('@wordpress/')) {
		const checkResult = isWpScriptPackage(packageName);
		if (checkResult.isExternal) {
			return {
				global: wpPackageToGlobal(packageName),
				handle: wpPackageToHandle(packageName),
				// Include installation status for warning purposes
				_isInstalled: checkResult.isInstalled,
			} as ExternalResolution & { _isInstalled: boolean };
		}
		// Not a wpScript package, don't externalize
		return null;
	}

	// 2. Check custom namespaces from config
	const externalNamespaces = config.externalNamespaces || {};
	for (const [namespace, mapping] of Object.entries(externalNamespaces)) {
		if (packageName.startsWith(`${namespace}/`)) {
			const name = packageName.replace(`${namespace}/`, '');
			return {
				global: `${mapping.global}.${camelCase(name)}`,
				handle: `${mapping.handlePrefix}-${name}`,
			};
		}
	}

	// 3. Check vendor externals
	if (vendorExternals[packageName]) {
		return vendorExternals[packageName];
	}

	return null;
}

/**
 * Get all external patterns for esbuild
 *
 * IMPORTANT: We return an empty array because ALL externalization is handled
 * by the wp-dependency-extraction plugin's onResolve hooks.
 *
 * Why? esbuild's `external` option has HIGHER priority than plugins - if a path
 * matches an external pattern, onResolve callbacks are NOT run at all.
 *
 * Our plugin needs to run for ALL packages to:
 * - Decide per-package whether to externalize or bundle (wpScript flag)
 * - Provide virtual modules for IIFE builds (avoid require() calls in browser)
 * - Track dependencies for .asset.php generation
 */
export function getExternalPatterns(_config: Partial<BuildConfig> = {}): string[] {
	// Return empty - let the wp-dependency-extraction plugin handle all externals
	return [];
}

/**
 * Create esbuild global mappings for externals
 */
export function createGlobalMappings(
	dependencies: Set<string>,
	config: Partial<BuildConfig> = {},
): Record<string, string> {
	const mappings: Record<string, string> = {};

	for (const dep of dependencies) {
		const external = resolveExternal(dep, config);
		if (external) {
			mappings[dep] = external.global;
		}
	}

	return mappings;
}
