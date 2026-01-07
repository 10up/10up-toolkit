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
 * Create the WordPress Dependency Extraction plugin
 * Each plugin instance has its own dependency tracking state
 */
export function wpDependencyExtractionPlugin(config: BuildConfig): Plugin {
	// Instance-specific state
	const entryDependencies = new Map<string, Set<string>>();
	const importerToEntry = new Map<string, string>();

	/**
	 * Get the entry point for an importer
	 */
	function getEntryForImporter(importer: string): string | undefined {
		const normalizedImporter = normalizePath(importer);

		// If importer is itself an entry, return it
		if (entryDependencies.has(normalizedImporter)) {
			return normalizedImporter;
		}

		// Otherwise, look up the entry point
		return importerToEntry.get(normalizedImporter);
	}

	/**
	 * Track a dependency for an entry point
	 */
	function trackDependency(importer: string, handle: string): void {
		const entry = getEntryForImporter(importer);
		if (entry) {
			const deps = entryDependencies.get(entry);
			if (deps) {
				deps.add(handle);
			}
		}
	}

	/**
	 * Register an importer-to-entry mapping
	 */
	function registerImporter(importer: string, entry: string): void {
		const normalizedImporter = normalizePath(importer);
		const normalizedEntry = normalizePath(entry);
		if (normalizedImporter !== normalizedEntry) {
			importerToEntry.set(normalizedImporter, normalizedEntry);
		}
	}

	return {
		name: 'wp-dependency-extraction',

		setup(build) {
			// Get entry points to initialize tracking
			const entryPoints = build.initialOptions.entryPoints;

			if (entryPoints) {
				if (Array.isArray(entryPoints)) {
					for (const entry of entryPoints) {
						if (typeof entry === 'string') {
							// Resolve to absolute path for consistent matching later
							entryDependencies.set(normalizePath(resolve(entry)), new Set());
						}
					}
				} else if (typeof entryPoints === 'object') {
					for (const entry of Object.values(entryPoints)) {
						// Resolve to absolute path for consistent matching later
						entryDependencies.set(normalizePath(resolve(entry)), new Set());
					}
				}
			}

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

						// Track the dependency
						if (args.importer) {
							trackDependency(args.importer, external.handle);

							// Map this importer to its entry
							const entry = getEntryForImporter(args.importer);
							if (entry) {
								registerImporter(args.importer, entry);
							}
						}

						return {
							path: args.path,
							external: true,
							namespace: 'wp-external',
						};
					}

					return undefined;
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

						return {
							path: args.path,
							external: true,
							namespace: 'vendor-external',
						};
					}

					return undefined;
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

							return {
								path: args.path,
								external: true,
								namespace: 'custom-external',
							};
						},
					);
				}
			}

			// Track imports between modules to propagate entry point info
			build.onResolve({ filter: /.*/ }, (args: OnResolveArgs): undefined => {
				if (args.importer && args.kind !== 'entry-point') {
					const entry = getEntryForImporter(args.importer);
					if (entry) {
						// Try to resolve the imported path
						const resolvedPath = args.resolveDir
							? resolve(args.resolveDir, args.path)
							: args.path;
						registerImporter(resolvedPath, entry);
					}
				}
				return undefined;
			});

			// Generate .asset.php files at the end of build
			build.onEnd(async (result): Promise<OnEndResult | undefined> => {
				if (result.errors.length > 0) {
					return undefined;
				}

				const metafile = result.metafile;

				if (!metafile) {
					return undefined;
				}

				// Build a map from entry point paths to their output paths
				const entryToOutput = new Map<string, { path: string; isModule: boolean }>();

				for (const [outputPath, outputMeta] of Object.entries(metafile.outputs)) {
					if (!outputMeta.entryPoint) {
						continue;
					}

					// Normalize the entry point path for matching
					const entryPath = normalizePath(resolve(outputMeta.entryPoint));

					// Check if it's a module
					const isModule = outputPath.endsWith('.mjs');

					// Skip chunks
					if (outputPath.includes('/chunks/')) {
						continue;
					}

					entryToOutput.set(entryPath, { path: outputPath, isModule });
				}

				// Generate .asset.php for each tracked entry
				for (const [entryPath, deps] of entryDependencies) {
					const outputInfo = entryToOutput.get(entryPath);
					if (!outputInfo) {
						continue;
					}

					const { path: outputPath, isModule } = outputInfo;

					// Read output file content for version hash
					let content = '';
					try {
						content = readFileSync(outputPath, 'utf8');
					} catch {
						// File might not exist yet, use empty content
					}
					const version = getContentHash(content);

					// Generate .asset.php with appropriate format
					const assetPhpPath = outputPath.replace(/\.(m?js)$/, '.asset.php');
					const sortedDeps = Array.from(deps).sort();

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
