/**
 * WordPress and vendor externals handling
 *
 * Uses dynamic detection via wpScript flag in package.json
 * instead of maintaining a hardcoded list.
 */

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
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
 * Cache for package.json wpScript lookups
 */
const wpScriptCache = new Map<string, boolean>();

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
 * @param packageName - The @wordpress/* package name to check
 * @returns Object with isExternal and isInstalled flags
 */
export function isWpScriptPackage(packageName: string): WpPackageCheckResult {
	// Check cache first
	const cached = wpScriptCache.get(packageName);
	if (cached !== undefined) {
		// For cached results, we can't determine isInstalled from boolean
		// So we need to try resolving again
	}

	try {
		const pkgJsonPath = require.resolve(`${packageName}/package.json`);
		const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));
		const hasWpScript = pkgJson.wpScript === true;
		wpScriptCache.set(packageName, hasWpScript);
		return { isExternal: hasWpScript, isInstalled: true };
	} catch {
		// Package not installed - assume it should be externalized
		// since all @wordpress/* packages with wpScript=true are
		// available as WordPress globals at runtime
		wpScriptCache.set(packageName, true);
		return { isExternal: true, isInstalled: false };
	}
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
 */
export function getExternalPatterns(config: Partial<BuildConfig> = {}): string[] {
	const patterns: string[] = [
		// Vendor externals
		...Object.keys(vendorExternals),
		// WordPress packages (will be filtered by wpScript check at resolve time)
		'@wordpress/*',
	];

	// Add custom namespace patterns
	const externalNamespaces = config.externalNamespaces || {};
	for (const namespace of Object.keys(externalNamespaces)) {
		patterns.push(`${namespace}/*`);
	}

	return patterns;
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
