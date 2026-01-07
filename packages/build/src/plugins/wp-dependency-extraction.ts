/**
 * WordPress Dependency Extraction Plugin for esbuild
 *
 * Tracks @wordpress/* and vendor imports, externalizes them,
 * and generates .asset.php files with dependency metadata.
 *
 * For ES Modules, generates a different format:
 * <?php return array('dependencies' => array('@wordpress/interactivity'), 'version' => 'xxx', 'type' => 'module');
 */

import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import pc from 'picocolors';
import type { Plugin, OnResolveArgs, OnResolveResult, OnEndResult } from 'esbuild';
import { resolveExternal, vendorExternals } from '../utils/externals.js';
import { getContentHash } from '../utils/paths.js';
import type { BuildConfig, DependencyInfo } from '../types.js';

/**
 * Track which packages we've already warned about to avoid duplicate warnings
 */
const warnedPackages = new Set<string>();

/**
 * Warn about uninstalled @wordpress packages
 *
 * While packages will still be externalized (since they're available in WordPress),
 * installing them provides TypeScript types and allows for better dependency tracking.
 *
 * @param packageName - The @wordpress/* package name
 */
function warnUninstalledPackage(packageName: string): void {
	if (warnedPackages.has(packageName)) {
		return;
	}
	warnedPackages.add(packageName);

	// Only warn once per build
	if (warnedPackages.size === 1) {
		console.log(
			pc.yellow('\nNote: ') +
				pc.dim('Some @wordpress packages are not installed locally.'),
		);
		console.log(
			pc.dim('For better TypeScript support and dependency tracking, consider installing them:'),
		);
		console.log(pc.dim('npm install --save-optional @wordpress/blocks @wordpress/i18n ...\n'));
	}
}

/**
 * Generate PHP array syntax for dependencies (IIFE/classic scripts)
 */
function generatePhpArray(deps: string[]): string {
	if (deps.length === 0) {
		return 'array()';
	}
	const items = deps.map((d) => `'${d}'`).join(', ');
	return `array(${items})`;
}

/**
 * Generate .asset.php file content for classic scripts (IIFE)
 */
function generateAssetPhp(dependencies: string[], version: string): string {
	return `<?php return array('dependencies' => ${generatePhpArray(dependencies)}, 'version' => '${version}');
`;
}

/**
 * Generate .asset.php file content for ES Modules
 * ES Modules use the package name directly (e.g., '@wordpress/interactivity')
 * rather than the wp-handle format
 */
function generateModuleAssetPhp(dependencies: string[], version: string): string {
	if (dependencies.length === 0) {
		return `<?php return array('dependencies' => array(), 'version' => '${version}', 'type' => 'module');
`;
	}
	// For modules, dependencies are the actual package names
	const items = dependencies.map((d) => `'${d}'`).join(', ');
	return `<?php return array('dependencies' => array(${items}), 'version' => '${version}', 'type' => 'module');
`;
}

/**
 * Convert a handle back to package name for ES modules
 * wp-interactivity -> @wordpress/interactivity
 */
function handleToPackageName(handle: string): string {
	if (handle.startsWith('wp-')) {
		return `@wordpress/${handle.slice(3)}`;
	}
	// For vendor packages, return as-is (react, lodash, etc.)
	return handle;
}

/**
 * Normalize path for comparison (resolve and lowercase on Windows)
 */
function normalizePath(p: string): string {
	return resolve(p).replace(/\\/g, '/');
}

/**
 * Plugin options
 */
interface PluginOptions {
	/** Whether this build is for ES modules (affects asset.php format) */
	isModule?: boolean;
}

/**
 * Create the WordPress Dependency Extraction plugin
 * Each plugin instance has its own dependency tracking state
 */
export function wpDependencyExtractionPlugin(config: BuildConfig, options: PluginOptions = {}): Plugin {
	const { isModule = false } = options;

	// Track dependencies per importer file (not per entry)
	// This allows us to collect transitive dependencies from bundled packages
	const fileDependencies = new Map<string, Set<string>>();

	/**
	 * Track a dependency for a specific file
	 */
	function trackDependency(importer: string, handle: string): void {
		// Always resolve to absolute path for consistent matching with metafile
		const normalizedImporter = normalizePath(resolve(importer));
		let deps = fileDependencies.get(normalizedImporter);
		if (!deps) {
			deps = new Set();
			fileDependencies.set(normalizedImporter, deps);
		}
		deps.add(handle);
	}

	return {
		name: 'wp-dependency-extraction',

		setup(build) {

			// Handle @wordpress/* imports
			build.onResolve(
				{ filter: /^@wordpress\// },
				(args: OnResolveArgs): OnResolveResult | undefined => {
					const external = resolveExternal(args.path, config) as
						| (ReturnType<typeof resolveExternal> & { _isInstalled?: boolean })
						| null;

					if (external) {
						// Warn if package is not installed locally
						if (external._isInstalled === false) {
							warnUninstalledPackage(args.path);
						}

						// Track the dependency for this importer file
						if (args.importer) {
							trackDependency(args.importer, external.handle);
						}

						// For ES modules, use native external (import statements work)
						// For IIFE, use virtual module to access global (avoid require())
						if (isModule) {
							return {
								path: args.path,
								external: true,
							};
						}

						return {
							path: args.path,
							namespace: 'wp-external',
						};
					}

					return undefined;
				},
			);

			// For IIFE builds: provide virtual modules that access WordPress globals
			// This avoids generating require() calls which don't work in browsers
			build.onLoad(
				{ filter: /.*/, namespace: 'wp-external' },
				(args): { contents: string; loader: 'js' } => {
					const external = resolveExternal(args.path, config);
					const globalVar = external?.global || 'undefined';
					return {
						contents: `module.exports = ${globalVar};`,
						loader: 'js',
					};
				},
			);

			// Handle vendor externals (react, lodash, etc.)
			const vendorFilter = new RegExp(
				`^(${Object.keys(vendorExternals)
					.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
					.join('|')})$`,
			);

			build.onResolve(
				{ filter: vendorFilter },
				(args: OnResolveArgs): OnResolveResult | undefined => {
					const external = vendorExternals[args.path];

					if (external) {
						// Track the dependency
						if (args.importer) {
							trackDependency(args.importer, external.handle);
						}

						// For ES modules, use native external
						// For IIFE, use virtual module to access global
						if (isModule) {
							return {
								path: args.path,
								external: true,
							};
						}

						return {
							path: args.path,
							namespace: 'vendor-external',
						};
					}

					return undefined;
				},
			);

			// For IIFE builds: provide virtual modules for vendor externals
			build.onLoad(
				{ filter: /.*/, namespace: 'vendor-external' },
				(args): { contents: string; loader: 'js' } => {
					const external = vendorExternals[args.path];
					const globalVar = external?.global || 'undefined';
					return {
						contents: `module.exports = ${globalVar};`,
						loader: 'js',
					};
				},
			);

			// Handle custom namespace externals
			if (config.externalNamespaces && Object.keys(config.externalNamespaces).length > 0) {
				for (const [namespace, mapping] of Object.entries(config.externalNamespaces)) {
					const namespaceFilter = new RegExp(
						`^${namespace.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/`,
					);

					build.onResolve(
						{ filter: namespaceFilter },
						(args: OnResolveArgs): OnResolveResult | undefined => {
							const packageName = args.path.replace(`${namespace}/`, '');
							const handle = `${mapping.handlePrefix}-${packageName}`;

							// Track the dependency
							if (args.importer) {
								trackDependency(args.importer, handle);
							}

							// For ES modules, use native external
							// For IIFE, use virtual module to access global
							if (isModule) {
								return {
									path: args.path,
									external: true,
								};
							}

							return {
								path: args.path,
								namespace: `custom-external-${namespace}`,
							};
						},
					);

					// For IIFE builds: provide virtual modules for custom namespace externals
					build.onLoad(
						{ filter: /.*/, namespace: `custom-external-${namespace}` },
						(args): { contents: string; loader: 'js' } => {
							const packageName = args.path.replace(`${namespace}/`, '');
							// Convert to camelCase for global access
							const camelName = packageName.replace(/-([a-z])/g, (_: string, letter: string) => letter.toUpperCase());
							const globalVar = `${mapping.global}.${camelName}`;
							return {
								contents: `module.exports = ${globalVar};`,
								loader: 'js',
							};
						},
					);
				}
			}

			// Generate .asset.php files at the end of build
			// Uses metafile to collect ALL dependencies from ALL input files in each bundle
			// This properly handles transitive dependencies from bundled packages
			build.onEnd(async (result): Promise<OnEndResult | undefined> => {
				if (result.errors.length > 0) {
					return undefined;
				}

				const metafile = result.metafile;

				if (!metafile) {
					return undefined;
				}

				// Process each output that has an entry point
				for (const [outputPath, outputMeta] of Object.entries(metafile.outputs)) {
					if (!outputMeta.entryPoint) {
						continue;
					}

					// Skip chunks
					if (outputPath.includes('/chunks/')) {
						continue;
					}

					// Collect ALL dependencies from ALL input files in this bundle
					// This catches transitive deps from bundled packages like @10up/block-components
					const allDeps = new Set<string>();

					for (const inputPath of Object.keys(outputMeta.inputs)) {
						// Normalize input path to match our tracking
						const normalizedInput = normalizePath(resolve(inputPath));
						const deps = fileDependencies.get(normalizedInput);
						if (deps) {
							for (const dep of deps) {
								allDeps.add(dep);
							}
						}
					}

					// Read output file content for version hash AND to scan for WP globals
					let content = '';
					try {
						content = readFileSync(outputPath, 'utf8');
					} catch {
						// File might not exist yet, use empty content
					}
					const version = getContentHash(content);

					// Scan the output for WordPress dependencies from pre-bundled packages
					// This catches deps from webpack-bundled packages like @10up/block-components
					if (content) {
						// 1. Match wp.packageName global accesses (e.g., wp.blocks, wp.blockEditor)
						const wpGlobalPattern = /(?:=|,|\()\s*wp\.([a-zA-Z][a-zA-Z0-9]*)/g;
						let match;
						while ((match = wpGlobalPattern.exec(content)) !== null) {
							const globalName = match[1];
							// Convert camelCase to kebab-case for handle (e.g., blockEditor -> block-editor)
							const handle = 'wp-' + globalName.replace(/([A-Z])/g, '-$1').toLowerCase();
							allDeps.add(handle);
						}

						// 2. Match webpack require patterns: __webpack_require__("@wordpress/...")
						// or __webpack_require__(/*! @wordpress/... */ "@wordpress/...")
						// Use [^"]* to skip the comment and match the actual module ID
						const webpackRequirePattern = /__webpack_require__\([^"]*"@wordpress\/([^"]+)"/g;
						while ((match = webpackRequirePattern.exec(content)) !== null) {
							const packageName = match[1];
							const handle = 'wp-' + packageName;
							allDeps.add(handle);
						}

						// 3. Also match __webpack_require__.n() wrappers that reference WP externals
						// e.g., __webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__)
						// We need to find the variable declarations that map to @wordpress packages
						const wpModuleVarPattern = /var\s+(_wordpress_[a-zA-Z0-9_]+)__WEBPACK_IMPORTED_MODULE_\d+__\s*=\s*__webpack_require__\([^"]*"@wordpress\/([^"]+)"/g;
						while ((match = wpModuleVarPattern.exec(content)) !== null) {
							const packageName = match[2];
							const handle = 'wp-' + packageName;
							allDeps.add(handle);
						}
					}

					// Also scan for vendor globals (React, ReactDOM, lodash, jQuery, moment)
					if (content) {
						if (/(?:=|,|\()\s*React[^a-zA-Z]/.test(content)) allDeps.add('react');
						if (/(?:=|,|\()\s*ReactDOM[^a-zA-Z]/.test(content)) allDeps.add('react-dom');
						if (/(?:=|,|\()\s*ReactJSXRuntime[^a-zA-Z]/.test(content)) allDeps.add('react-jsx-runtime');
						if (/(?:=|,|\()\s*lodash[^a-zA-Z]/.test(content)) allDeps.add('lodash');
						if (/(?:=|,|\()\s*jQuery[^a-zA-Z]/.test(content)) allDeps.add('jquery');
						if (/(?:=|,|\()\s*moment[^a-zA-Z]/.test(content)) allDeps.add('moment');
					}

					// Generate .asset.php with appropriate format
					const assetPhpPath = outputPath.replace(/\.(m?js)$/, '.asset.php');
					const sortedDeps = Array.from(allDeps).sort();

					let assetPhpContent: string;
					if (isModule) {
						// For ES modules, convert handles back to package names
						const packageDeps = sortedDeps.map(handleToPackageName);
						assetPhpContent = generateModuleAssetPhp(packageDeps, version);
					} else {
						assetPhpContent = generateAssetPhp(sortedDeps, version);
					}

					// Ensure directory exists
					mkdirSync(dirname(assetPhpPath), { recursive: true });

					// Write asset file
					writeFileSync(assetPhpPath, assetPhpContent, 'utf8');
				}

				return undefined;
			});
		},
	};
}

/**
 * Get all tracked dependencies (for testing/debugging)
 * Note: This returns empty map since dependencies are now instance-specific
 */
export function getDependencies(): Map<string, DependencyInfo> {
	return new Map();
}

/**
 * Clear all tracked dependencies (for testing)
 * Note: This is now a no-op since dependencies are instance-specific
 */
export function clearDependencies(): void {
	// No-op - dependencies are now cleared per plugin instance
}
