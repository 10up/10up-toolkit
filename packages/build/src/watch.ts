/**
 * Watch mode with React Fast Refresh support
 */

import { mkdirSync, rmSync, existsSync } from 'node:fs';
import * as esbuild from 'esbuild';
import { WebSocketServer, WebSocket } from 'ws';
import pc from 'picocolors';
import { loadConfig, getOutputDir } from './config.js';
import { getExternalPatterns } from './utils/externals.js';
import { detectEntries, getBlockSpecificStyles } from './utils/entry-detection.js';
import { wpDependencyExtractionPlugin } from './plugins/wp-dependency-extraction.js';
import { sassPlugin } from './plugins/sass-plugin.js';
import { processBlockJsonFiles } from './plugins/block-json.js';
import { copyStaticAssets } from './plugins/copy-assets.js';
import type { BuildConfig, WatchOptions } from './types.js';

let wsServer: WebSocketServer | null = null;
let clients: Set<WebSocket> = new Set();

/**
 * Send message to all connected clients
 */
function broadcast(message: object): void {
	const data = JSON.stringify(message);
	for (const client of clients) {
		if (client.readyState === WebSocket.OPEN) {
			client.send(data);
		}
	}
}

/**
 * Notify clients of rebuild (exported for future use)
 */
export function notifyRebuild(success: boolean): void {
	broadcast({
		type: success ? 'reload' : 'error',
		timestamp: Date.now(),
	});
}

/**
 * Create React Fast Refresh runtime injection plugin
 */
function reactRefreshPlugin(): esbuild.Plugin {
	return {
		name: 'react-refresh',
		setup(_build) {
			// Placeholder for React Fast Refresh implementation
			// In a complete implementation, this would inject the refresh runtime
			// and handle HMR updates for React components
		},
	};
}

/**
 * Start WebSocket server for HMR
 */
function startWebSocketServer(port: number): void {
	if (wsServer) {
		return;
	}

	wsServer = new WebSocketServer({ port });

	wsServer.on('connection', (ws) => {
		clients.add(ws);
		ws.on('close', () => {
			clients.delete(ws);
		});
	});

	console.log(pc.dim(`HMR server running on ws://localhost:${port}`));
}

/**
 * Stop WebSocket server
 */
function stopWebSocketServer(): void {
	if (wsServer) {
		for (const client of clients) {
			client.close();
		}
		clients.clear();
		wsServer.close();
		wsServer = null;
	}
}

/**
 * Create esbuild context for watch mode
 */
async function createWatchContext(
	entries: Record<string, string>,
	config: BuildConfig,
	outputDir: string,
	isModule: boolean,
): Promise<esbuild.BuildContext | null> {
	if (Object.keys(entries).length === 0) {
		return null;
	}

	const plugins: esbuild.Plugin[] = [
		wpDependencyExtractionPlugin(config),
		sassPlugin(config, false),
	];

	if (config.hot && !isModule) {
		plugins.push(reactRefreshPlugin());
	}

	const external = config.wpDependencyExternals ? getExternalPatterns(config) : [];

	const context = await esbuild.context({
		entryPoints: entries,
		bundle: true,
		metafile: true,
		sourcemap: true,
		minify: false,
		target: ['es2020'],
		format: isModule ? 'esm' : 'iife',
		splitting: isModule,
		outdir: outputDir,
		external,
		outExtension: isModule ? { '.js': '.mjs' } : { '.js': '.js' },
		entryNames: '[dir]/[name]',
		chunkNames: 'js/chunks/[name]-[hash]',
		plugins,
		loader: {
			'.js': 'jsx',
			'.ts': 'tsx',
			'.tsx': 'tsx',
			'.jsx': 'jsx',
		},
		jsx: 'automatic',
		logLevel: 'warning',
		define: config.hot
			? { __HMR_PORT__: String(config.devServerPort) }
			: {},
	});

	return context;
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
 * Watch mode entry point
 */
export async function watch(options: WatchOptions = {}): Promise<void> {
	const config = loadConfig();
	const outputDir = getOutputDir(config);
	const hot = options.hot ?? config.hot;
	const port = options.port ?? config.devServerPort;

	console.log(pc.cyan('\n10up-build') + pc.dim(' v1.0.0 (watch mode)'));
	console.log(pc.dim(`Hot reload: ${hot ? 'enabled' : 'disabled'}\n`));

	// Clean output directory
	cleanOutputDir(outputDir);

	// Detect entries
	const entries = await detectEntries(config);

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
		return;
	}

	console.log(pc.dim(`Watching ${totalEntries} entries...\n`));

	// Start HMR server if hot reload is enabled
	if (hot) {
		startWebSocketServer(port);
	}

	// Create watch contexts
	const [scriptsContext, modulesContext] = await Promise.all([
		createWatchContext(entries.scripts, config, outputDir, false),
		createWatchContext(entries.modules, config, outputDir, true),
	]);

	// Build styles once (no watch needed for now - could add chokidar later)
	if (Object.keys(entries.styles).length > 0) {
		try {
			await esbuild.build({
				entryPoints: entries.styles,
				bundle: true,
				outdir: outputDir,
				plugins: [sassPlugin(config, false)],
				entryNames: '[dir]/[name]',
				logLevel: 'warning',
			});
			console.log(pc.green('✓') + pc.dim(` Styles built`));
		} catch (error) {
			console.error(pc.red('✗ Style build failed'));
		}
	}

	// Process block.json files
	if (config.useBlockAssets) {
		await processBlockJsonFiles(config, outputDir);
	}

	// Copy static assets
	await copyStaticAssets(config, outputDir);

	// Start watching
	if (scriptsContext) {
		await scriptsContext.watch();
		console.log(pc.green('✓') + pc.dim(` Watching ${Object.keys(entries.scripts).length} script entries`));
	}

	if (modulesContext) {
		await modulesContext.watch();
		console.log(pc.green('✓') + pc.dim(` Watching ${Object.keys(entries.modules).length} module entries`));
	}

	console.log(pc.cyan('\nWatching for changes...'));
	console.log(pc.dim('Press Ctrl+C to stop\n'));

	// Handle graceful shutdown
	const cleanup = async () => {
		console.log(pc.dim('\nStopping watch mode...'));
		stopWebSocketServer();
		if (scriptsContext) await scriptsContext.dispose();
		if (modulesContext) await modulesContext.dispose();
		process.exit(0);
	};

	process.on('SIGINT', cleanup);
	process.on('SIGTERM', cleanup);
}
