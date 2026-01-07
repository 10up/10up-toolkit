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
 * Profiling data for build phases
 */
interface BuildProfile {
	configLoad: number;
	entryDetection: number;
	cleanOutput: number;
	scripts: number;
	modules: number;
	styles: number;
	blockJson: number;
	assetCopy: number;
	total: number;
}

/**
 * Profile enabled via environment variable
 */
const PROFILE_ENABLED = process.env.BUILD_PROFILE === '1' || process.env.BUILD_PROFILE === 'true';

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
			wpDependencyExtractionPlugin(config, { isModule: true }),
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
		return `${ms.toFixed(0)}ms`;
	}
	return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Format profile duration with padding for alignment
 */
function formatProfileDuration(ms: number, total: number): string {
	const percentage = total > 0 ? ((ms / total) * 100).toFixed(1) : '0.0';
	const duration = formatDuration(ms);
	return `${duration.padStart(8)} ${pc.dim(`(${percentage.padStart(5)}%)`)}`;
}

/**
 * Print build profile report
 */
function printProfile(profile: BuildProfile): void {
	console.log(pc.cyan('\n┌─ Build Profile ─────────────────────────┐'));

	const phases: Array<{ name: string; time: number; entries?: number }> = [
		{ name: 'Config loading', time: profile.configLoad },
		{ name: 'Entry detection', time: profile.entryDetection },
		{ name: 'Clean output', time: profile.cleanOutput },
		{ name: 'Scripts (IIFE)', time: profile.scripts },
		{ name: 'Modules (ESM)', time: profile.modules },
		{ name: 'Styles (CSS)', time: profile.styles },
		{ name: 'Block JSON', time: profile.blockJson },
		{ name: 'Asset copy', time: profile.assetCopy },
	];

	for (const phase of phases) {
		if (phase.time > 0) {
			const bar = getProgressBar(phase.time, profile.total, 15);
			console.log(
				pc.dim('│ ') +
					phase.name.padEnd(16) +
					formatProfileDuration(phase.time, profile.total) +
					' ' +
					bar,
			);
		}
	}

	console.log(pc.dim('├──────────────────────────────────────────┤'));
	console.log(pc.dim('│ ') + pc.bold('Total'.padEnd(16)) + formatProfileDuration(profile.total, profile.total));
	console.log(pc.cyan('└──────────────────────────────────────────┘\n'));
}

/**
 * Generate a simple progress bar
 */
function getProgressBar(value: number, total: number, width: number): string {
	const percentage = total > 0 ? value / total : 0;
	const filled = Math.round(percentage * width);
	const empty = width - filled;
	return pc.cyan('█'.repeat(filled)) + pc.dim('░'.repeat(empty));
}

/**
 * Main build function
 */
export async function build(customConfig?: Partial<BuildConfig>): Promise<BuildResult> {
	const startTime = performance.now();
	const profile: BuildProfile = {
		configLoad: 0,
		entryDetection: 0,
		cleanOutput: 0,
		scripts: 0,
		modules: 0,
		styles: 0,
		blockJson: 0,
		assetCopy: 0,
		total: 0,
	};

	// Config loading
	let phaseStart = performance.now();
	const config = { ...loadConfig(), ...customConfig };
	const outputDir = getOutputDir(config);
	const isProd = isProduction();
	profile.configLoad = performance.now() - phaseStart;

	console.log(pc.cyan('\n10up-build') + pc.dim(` v1.0.0`));
	console.log(pc.dim(`Mode: ${isProd ? 'production' : 'development'}\n`));

	try {
		// Clean output directory
		phaseStart = performance.now();
		cleanOutputDir(outputDir);
		profile.cleanOutput = performance.now() - phaseStart;

		// Detect all entry points
		phaseStart = performance.now();
		const entries: DetectedEntries = await detectEntries(config);

		// Add block-specific styles if enabled
		if (config.loadBlockSpecificStyles) {
			const blockStyles = getBlockSpecificStyles(config);
			Object.assign(entries.styles, blockStyles);
		}
		profile.entryDetection = performance.now() - phaseStart;

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

		// Build in parallel, tracking individual times
		const buildPromises: Promise<void>[] = [];

		// Scripts
		if (Object.keys(entries.scripts).length > 0) {
			buildPromises.push(
				(async () => {
					const start = performance.now();
					await buildScripts(entries.scripts, config, outputDir, isProd);
					profile.scripts = performance.now() - start;
				})(),
			);
		}

		// Modules
		if (Object.keys(entries.modules).length > 0) {
			buildPromises.push(
				(async () => {
					const start = performance.now();
					await buildModules(entries.modules, config, outputDir, isProd);
					profile.modules = performance.now() - start;
				})(),
			);
		}

		// Styles
		if (Object.keys(entries.styles).length > 0) {
			buildPromises.push(
				(async () => {
					const start = performance.now();
					await buildStyles(entries.styles, config, outputDir, isProd);
					profile.styles = performance.now() - start;
				})(),
			);
		}

		await Promise.all(buildPromises);

		// Process block.json files
		phaseStart = performance.now();
		if (config.useBlockAssets) {
			await processBlockJsonFiles(config, outputDir);
		}
		profile.blockJson = performance.now() - phaseStart;

		// Copy static assets
		phaseStart = performance.now();
		const assetCount = await copyStaticAssets(config, outputDir);
		profile.assetCopy = performance.now() - phaseStart;

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
		profile.total = duration;

		console.log(pc.green(`\n✓ Done in ${formatDuration(duration)}`));

		// Print profile if enabled
		if (PROFILE_ENABLED) {
			printProfile(profile);
		}

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
