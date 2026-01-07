/**
 * CLI for 10up-build
 */

import pc from 'picocolors';
import { build } from './build.js';
import { watch } from './watch.js';
import { syncWpDeps, updateWpDeps, listWpDeps } from './wp-deps.js';
import type { Commands } from './types.js';

/**
 * Parse CLI arguments
 */
function parseArgs(args: string[]): { command: string; flags: Record<string, string | boolean> } {
	const flags: Record<string, string | boolean> = {};
	let command = 'build';

	for (const arg of args) {
		if (arg.startsWith('--')) {
			const [key, value] = arg.slice(2).split('=');
			flags[key] = value ?? true;
		} else if (arg.startsWith('-')) {
			flags[arg.slice(1)] = true;
		} else if (!command || command === 'build') {
			// First non-flag argument is the command
			command = arg;
		}
	}

	return { command, flags };
}

/**
 * Show help message
 */
function showHelp(): void {
	console.log(`
${pc.cyan('10up-build')} - Fast WordPress build tool powered by esbuild

${pc.bold('Usage:')}
  10up-build <command> [options]

${pc.bold('Commands:')}
  build          Build for production (default)
  start          Start development mode with watch and hot reload
  watch          Watch for changes without hot reload
  sync-wp-deps   Scan source files and install @wordpress/* as optional deps
  update-wp-deps Update all @wordpress/* optional deps to a new version tag
  list-wp-deps   List installed @wordpress/* dependencies

${pc.bold('Options:')}
  --help, -h         Show this help message
  --version, -v      Show version number
  --hot              Enable hot reload (default in start mode)
  --port=<port>      HMR server port (default: 8887)
  --tag=<tag>        WordPress version tag (auto-detects latest if not specified)
  --dry-run          Show what would be done without making changes
  --workspace-scan   Scan all workspaces and install at monorepo root

${pc.bold('Configuration:')}
  Configure via package.json "10up-toolkit" field.
  See documentation for all options.

${pc.bold('Examples:')}
  10up-build                            # Production build
  10up-build start                      # Development with hot reload
  10up-build watch                      # Watch without hot reload
  10up-build sync-wp-deps               # Install @wordpress deps (auto-detects latest WP)
  10up-build sync-wp-deps --tag=wp-6.8  # Use specific WP version tag
  10up-build sync-wp-deps --workspace-scan  # Scan all workspaces, install at root
  10up-build update-wp-deps --tag=wp-6.9  # Update to new WP version
  10up-build list-wp-deps               # Show installed @wordpress deps
`);
}

/**
 * Show version
 */
function showVersion(): void {
	console.log('10up-build v1.0.0-alpha.5');
}

/**
 * Command handlers
 */
const commands: Commands = {
	build: async (_args: string[]) => {
		process.env.NODE_ENV = process.env.NODE_ENV || 'production';
		const result = await build();
		process.exit(result.success ? 0 : 1);
	},

	start: async (args: string[]) => {
		process.env.NODE_ENV = 'development';
		const { flags } = parseArgs(['start', ...args]);
		await watch({
			hot: true,
			port: flags.port ? parseInt(String(flags.port), 10) : undefined,
		});
	},

	watch: async (args: string[]) => {
		process.env.NODE_ENV = 'development';
		const { flags } = parseArgs(['watch', ...args]);
		await watch({
			hot: flags.hot === true,
			port: flags.port ? parseInt(String(flags.port), 10) : undefined,
		});
	},

	'sync-wp-deps': async (args: string[]) => {
		const { flags } = parseArgs(['sync-wp-deps', ...args]);
		await syncWpDeps({
			tag: flags.tag ? String(flags.tag) : undefined,
			dryRun: flags['dry-run'] === true,
			workspaceScan: flags['workspace-scan'] === true,
		});
	},

	'update-wp-deps': async (args: string[]) => {
		const { flags } = parseArgs(['update-wp-deps', ...args]);
		if (!flags.tag) {
			console.error(pc.red('Error: --tag is required for update-wp-deps'));
			console.log(pc.dim('Example: 10up-build update-wp-deps --tag=wp-6.9'));
			process.exit(1);
		}
		await updateWpDeps({
			tag: String(flags.tag),
			dryRun: flags['dry-run'] === true,
		});
	},

	'list-wp-deps': async () => {
		await listWpDeps();
	},
};

/**
 * Main CLI entry point
 */
export async function cli(args: string[]): Promise<void> {
	const { command, flags } = parseArgs(args);

	// Handle help flag
	if (flags.help || flags.h) {
		showHelp();
		return;
	}

	// Handle version flag
	if (flags.version || flags.v) {
		showVersion();
		return;
	}

	// Get command handler
	const handler = commands[command as keyof Commands];

	if (!handler) {
		console.error(pc.red(`Unknown command: ${command}`));
		console.log(pc.dim('Run "10up-build --help" for usage information.'));
		process.exit(1);
	}

	try {
		await handler(args.slice(1));
	} catch (error) {
		console.error(pc.red('Error:'), error instanceof Error ? error.message : error);
		process.exit(1);
	}
}
