/**
 * Main build orchestration for 10up-build
 */

import { mkdirSync, rmSync, existsSync } from 'node:fs';
// path imports used in type annotations
import * as esbuild from 'esbuild';
import pc from 'picocolors';
import { loadConfig, getOutputDir, isProduction } from './config.js';
import { detectEntries, getBlockSpecificStyles } from './utils/entry-detection.js';
import { wpDependencyExtractionPlugin, clearDependencies } from './plugins/wp-dependency-extraction.js';
import { sassPlugin } from './plugins/sass-plugin.js';
import { processBlockJsonFiles } from './plugins/block-json.js';
import { copyStaticAssets } from './plugins/copy-assets.js';
import type { BuildConfig, BuildResult, DetectedEntries } from './types.js';

import { getExternalPatterns } from './utils/externals.js';

/**
 * Get common esbuild options
 */
function getCommonOptions(config: BuildConfig, outputDir: string, isProd: boolean): esbuild.BuildOptions {
	// Get external patterns for WordPress and vendor packages
	const external = config.wpDependencyExternals ? getExternalPatterns(config) : [];

	return {
		bundle: true,
		metafile: true,
		sourcemap: config.sourcemap || !isProd,
		minify: isProd,
		target: ['es2020'],
		external,
		loader: {
			'.js': 'jsx',
			'.ts': 'tsx',
			'.tsx': 'tsx',
			'.jsx': 'jsx',
		},
		jsx: 'automatic',
		logLevel: 'warning',
		outdir: outputDir,
		// Set working directory explicitly to ensure consistent path resolution
		absWorkingDir: process.cwd(),
	};
}

/**
 * Build JavaScript/TypeScript entries
 */
async function buildScripts(
	entries: Record<string, string>,
	config: BuildConfig,
	outputDir: string,
	isProd: boolean,
): Promise<esbuild.BuildResult | null> {
	if (Object.keys(entries).length === 0) {
		return null;
	}

	// Clear previous dependency tracking
	clearDependencies();

	const result = await esbuild.build({
		...getCommonOptions(config, outputDir, isProd),
		entryPoints: entries,
		format: 'iife',
		globalName: '__tenupBuild',
		plugins: [
			wpDependencyExtractionPlugin(config),
			sassPlugin(config, isProd),
		],
		outExtension: { '.js': '.js' },
		entryNames: '[dir]/[name]',
		chunkNames: 'js/chunks/[name]-[hash]',
		assetNames: 'assets/[name]-[hash]',
		write: true,
	});

	return result;
}

/**
 * Build ES Module entries
 */
async function buildModules(
	entries: Record<string, string>,
	config: BuildConfig,
	outputDir: string,
	isProd: boolean,
): Promise<esbuild.BuildResult | null> {
	if (Object.keys(entries).length === 0) {
		return null;
	}

	// Clear previous dependency tracking
	clearDependencies();

	const result = await esbuild.build({
		...getCommonOptions(config, outputDir, isProd),
		entryPoints: entries,
		format: 'esm',
		splitting: true,
		plugins: [
			wpDependencyExtractionPlugin(config),
			sassPlugin(config, isProd),
		],
		outExtension: { '.js': '.mjs' },
		entryNames: '[dir]/[name]',
		chunkNames: 'js/chunks/[name]-[hash]',
		assetNames: 'assets/[name]-[hash]',
		write: true,
	});

	return result;
}

/**
 * Build standalone CSS entries
 */
async function buildStyles(
	entries: Record<string, string>,
	config: BuildConfig,
	outputDir: string,
	isProd: boolean,
): Promise<esbuild.BuildResult | null> {
	if (Object.keys(entries).length === 0) {
		return null;
	}

	const result = await esbuild.build({
		...getCommonOptions(config, outputDir, isProd),
		entryPoints: entries,
		plugins: [sassPlugin(config, isProd)],
		outExtension: { '.js': '.js', '.css': '.css' },
		entryNames: '[dir]/[name]',
		write: true,
		// CSS-only builds still create empty JS files, we'll clean them up
		bundle: true,
	});

	return result;
}

/**
 * Clean output directory
 */
function cleanOutputDir(outputDir: string): void {
	if (existsSync(outputDir)) {
		rmSync(outputDir, { recursive: true, force: true });
	}
	mkdirSync(outputDir, { recursive: true });
}

/**
 * Format duration for display
 */
function formatDuration(ms: number): string {
	if (ms < 1000) {
		return `${ms}ms`;
	}
	return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Main build function
 */
export async function build(customConfig?: Partial<BuildConfig>): Promise<BuildResult> {
	const startTime = performance.now();
	const config = { ...loadConfig(), ...customConfig };
	const outputDir = getOutputDir(config);
	const isProd = isProduction();

	console.log(pc.cyan('\n10up-build') + pc.dim(` v1.0.0`));
	console.log(pc.dim(`Mode: ${isProd ? 'production' : 'development'}\n`));

	try {
		// Clean output directory
		cleanOutputDir(outputDir);

		// Detect all entry points
		const entries: DetectedEntries = await detectEntries(config);

		// Add block-specific styles if enabled
		if (config.loadBlockSpecificStyles) {
			const blockStyles = getBlockSpecificStyles(config);
			Object.assign(entries.styles, blockStyles);
		}

		const totalEntries =
			Object.keys(entries.scripts).length +
			Object.keys(entries.modules).length +
			Object.keys(entries.styles).length;

		if (totalEntries === 0) {
			console.log(pc.yellow('No entry points found.'));
			return {
				success: true,
				duration: performance.now() - startTime,
				entries: { scripts: 0, modules: 0, styles: 0 },
			};
		}

		console.log(pc.dim(`Building ${totalEntries} entries...\n`));

		// Build in parallel
		await Promise.all([
			buildScripts(entries.scripts, config, outputDir, isProd),
			buildModules(entries.modules, config, outputDir, isProd),
			buildStyles(entries.styles, config, outputDir, isProd),
		]);

		// Process block.json files
		if (config.useBlockAssets) {
			await processBlockJsonFiles(config, outputDir);
		}

		// Copy static assets
		const assetCount = await copyStaticAssets(config, outputDir);

		// Report results
		const scriptsCount = Object.keys(entries.scripts).length;
		const modulesCount = Object.keys(entries.modules).length;
		const stylesCount = Object.keys(entries.styles).length;

		if (scriptsCount > 0) {
			console.log(pc.green('✓') + pc.dim(` Scripts: ${scriptsCount} entries`));
		}
		if (modulesCount > 0) {
			console.log(pc.green('✓') + pc.dim(` Modules: ${modulesCount} entries`));
		}
		if (stylesCount > 0) {
			console.log(pc.green('✓') + pc.dim(` Styles: ${stylesCount} entries`));
		}
		if (assetCount > 0) {
			console.log(pc.green('✓') + pc.dim(` Assets: ${assetCount} files copied`));
		}

		const duration = performance.now() - startTime;
		console.log(pc.green(`\n✓ Done in ${formatDuration(duration)}`));

		return {
			success: true,
			duration,
			entries: {
				scripts: scriptsCount,
				modules: modulesCount,
				styles: stylesCount,
			},
		};
	} catch (error) {
		const duration = performance.now() - startTime;
		console.error(pc.red('\n✗ Build failed'));

		if (error instanceof Error) {
			console.error(pc.red(error.message));
		}

		return {
			success: false,
			duration,
			entries: { scripts: 0, modules: 0, styles: 0 },
			errors: [error instanceof Error ? error.message : String(error)],
		};
	}
}

export { loadConfig, getOutputDir, isProduction };
