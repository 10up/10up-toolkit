/**
 * WordPress dependency management utilities
 *
 * Provides commands to sync and update @wordpress/* dependencies
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import pc from 'picocolors';
import fg from 'fast-glob';
import { WP_SCRIPTS_CACHE_FILE } from './utils/externals.js';

const WP_VERSION_API = 'https://api.wordpress.org/core/version-check/1.7/';

interface WPVersionResponse {
	offers: Array<{
		response: string;
		version: string;
		current: string;
	}>;
}

/**
 * Fetch the latest WordPress version from the API
 * and convert it to an npm tag (e.g., "6.9.3" -> "wp-6.9")
 */
async function getLatestWpTag(): Promise<string> {
	try {
		const response = await fetch(WP_VERSION_API);
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}
		const data = (await response.json()) as WPVersionResponse;

		// Get the first offer which is the latest version
		const latestVersion = data.offers?.[0]?.version;
		if (!latestVersion) {
			throw new Error('No version found in API response');
		}

		// Convert version to tag: "6.9.3" -> "wp-6.9" (only major.minor)
		const [major, minor] = latestVersion.split('.');
		return `wp-${major}.${minor}`;
	} catch (error) {
		console.warn(
			pc.yellow(`\nWarning: Could not fetch latest WordPress version from API.`),
		);
		console.warn(pc.dim(`Using fallback: wp-6.8\n`));
		return 'wp-6.8';
	}
}

/**
 * Known @wordpress packages that are available on npm
 * This list includes packages commonly used in WordPress block development
 */
const KNOWN_WP_PACKAGES = new Set([
	'@wordpress/a11y',
	'@wordpress/annotations',
	'@wordpress/api-fetch',
	'@wordpress/autop',
	'@wordpress/blob',
	'@wordpress/block-directory',
	'@wordpress/block-editor',
	'@wordpress/block-library',
	'@wordpress/block-serialization-default-parser',
	'@wordpress/blocks',
	'@wordpress/commands',
	'@wordpress/components',
	'@wordpress/compose',
	'@wordpress/core-commands',
	'@wordpress/core-data',
	'@wordpress/data',
	'@wordpress/data-controls',
	'@wordpress/dataviews',
	'@wordpress/date',
	'@wordpress/deprecated',
	'@wordpress/dom',
	'@wordpress/dom-ready',
	'@wordpress/edit-post',
	'@wordpress/edit-site',
	'@wordpress/edit-widgets',
	'@wordpress/editor',
	'@wordpress/element',
	'@wordpress/escape-html',
	'@wordpress/format-library',
	'@wordpress/hooks',
	'@wordpress/html-entities',
	'@wordpress/i18n',
	'@wordpress/icons',
	'@wordpress/interactivity',
	'@wordpress/interactivity-router',
	'@wordpress/interface',
	'@wordpress/is-shallow-equal',
	'@wordpress/keyboard-shortcuts',
	'@wordpress/keycodes',
	'@wordpress/list-reusable-blocks',
	'@wordpress/media-utils',
	'@wordpress/notices',
	'@wordpress/nux',
	'@wordpress/patterns',
	'@wordpress/plugins',
	'@wordpress/preferences',
	'@wordpress/preferences-persistence',
	'@wordpress/primitives',
	'@wordpress/priority-queue',
	'@wordpress/private-apis',
	'@wordpress/redux-routine',
	'@wordpress/reusable-blocks',
	'@wordpress/rich-text',
	'@wordpress/router',
	'@wordpress/server-side-render',
	'@wordpress/shortcode',
	'@wordpress/style-engine',
	'@wordpress/token-list',
	'@wordpress/url',
	'@wordpress/viewport',
	'@wordpress/warning',
	'@wordpress/widgets',
	'@wordpress/wordcount',
]);

/**
 * Scan source files for @wordpress/* imports
 */
async function scanForWordPressImports(cwd: string): Promise<Set<string>> {
	const imports = new Set<string>();

	// Find all JS/TS source files, excluding node_modules and dist
	const files = await fg(['**/*.{js,jsx,ts,tsx}'], {
		cwd,
		ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/vendor/**'],
		absolute: true,
	});

	// Regex patterns to match imports
	const importPatterns = [
		/import\s+.*?from\s+['"](@wordpress\/[^'"\/]+)/g,
		/import\s*\(\s*['"](@wordpress\/[^'"\/]+)/g,
		/require\s*\(\s*['"](@wordpress\/[^'"\/]+)/g,
	];

	for (const file of files) {
		try {
			const content = readFileSync(file, 'utf-8');

			for (const pattern of importPatterns) {
				let match;
				while ((match = pattern.exec(content)) !== null) {
					const packageName = match[1];
					if (KNOWN_WP_PACKAGES.has(packageName)) {
						imports.add(packageName);
					}
				}
			}
		} catch {
			// Skip files that can't be read
		}
	}

	return imports;
}

/**
 * Read package.json from the current directory
 */
function readPackageJson(cwd: string): Record<string, unknown> {
	const packageJsonPath = join(cwd, 'package.json');
	try {
		return JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
	} catch {
		throw new Error(`Could not read package.json at ${packageJsonPath}`);
	}
}

/**
 * Get existing @wordpress packages from optionalDependencies
 */
function getExistingWpDeps(packageJson: Record<string, unknown>): Map<string, string> {
	const deps = new Map<string, string>();
	const optionalDeps = (packageJson.optionalDependencies || {}) as Record<string, string>;

	for (const [name, version] of Object.entries(optionalDeps)) {
		if (name.startsWith('@wordpress/')) {
			deps.set(name, version);
		}
	}

	return deps;
}

/**
 * Find the monorepo root by looking for package.json with workspaces field
 */
function findMonorepoRoot(startDir: string): string | null {
	let dir = startDir;
	while (dir !== dirname(dir)) {
		const packageJsonPath = join(dir, 'package.json');
		if (existsSync(packageJsonPath)) {
			try {
				const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
				if (packageJson.workspaces) {
					return dir;
				}
			} catch {
				// Continue searching
			}
		}
		dir = dirname(dir);
	}
	return null;
}

/**
 * Get workspace directories from monorepo root
 */
async function getWorkspaceDirectories(rootDir: string): Promise<string[]> {
	const packageJson = readPackageJson(rootDir);
	const workspaces = packageJson.workspaces as string[] | { packages: string[] } | undefined;

	if (!workspaces) {
		return [];
	}

	// Handle both array format and object format { packages: [...] }
	const patterns = Array.isArray(workspaces) ? workspaces : workspaces.packages || [];

	// Expand glob patterns to find actual workspace directories
	const directories: string[] = [];

	for (const pattern of patterns) {
		// Find directories matching the pattern that contain package.json
		const matches = await fg([`${pattern}/package.json`], {
			cwd: rootDir,
			absolute: true,
			onlyFiles: true,
		});

		for (const match of matches) {
			directories.push(dirname(match));
		}
	}

	return directories;
}

/**
 * Scan all workspaces for @wordpress/* imports
 */
async function scanWorkspacesForWordPressImports(
	rootDir: string,
	workspaceDirs: string[],
): Promise<Set<string>> {
	const allImports = new Set<string>();

	console.log(`Scanning ${pc.bold(String(workspaceDirs.length))} workspaces for @wordpress/* imports...\n`);

	for (const dir of workspaceDirs) {
		const imports = await scanForWordPressImports(dir);
		if (imports.size > 0) {
			const relativePath = dir.replace(rootDir + '/', '');
			console.log(`  ${pc.dim('•')} ${relativePath}: ${imports.size} packages`);
			for (const pkg of imports) {
				allImports.add(pkg);
			}
		}
	}

	return allImports;
}

/**
 * Sync @wordpress dependencies
 *
 * Scans source files for @wordpress/* imports and installs them
 * as optional dependencies using the specified WordPress version tag.
 *
 * With --workspace-scan, scans all workspaces in a monorepo and installs
 * dependencies at the root level for better performance.
 */
export async function syncWpDeps(
	options: { tag?: string; dryRun?: boolean; workspaceScan?: boolean } = {},
): Promise<void> {
	const cwd = process.cwd();
	const dryRun = options.dryRun || false;
	const workspaceScan = options.workspaceScan || false;

	console.log(pc.cyan('\n10up-build') + ' - Sync WordPress Dependencies\n');

	// Get tag from options or fetch latest from WordPress API
	let tag = options.tag;
	if (!tag) {
		console.log(`Fetching latest WordPress version...`);
		tag = await getLatestWpTag();
		console.log(`Using tag: ${pc.cyan(tag)}\n`);
	}

	let foundImports: Set<string>;
	let installDir: string;

	if (workspaceScan) {
		// Find monorepo root
		const monorepoRoot = findMonorepoRoot(cwd);
		if (!monorepoRoot) {
			console.error(pc.red('Error: Could not find monorepo root (no package.json with workspaces field).'));
			console.log(pc.dim('Run from within a monorepo or use without --workspace-scan.'));
			process.exit(1);
		}

		console.log(`Monorepo root: ${pc.dim(monorepoRoot)}\n`);
		installDir = monorepoRoot;

		// Get all workspace directories
		const workspaceDirs = await getWorkspaceDirectories(monorepoRoot);
		if (workspaceDirs.length === 0) {
			console.error(pc.red('Error: No workspaces found in monorepo.'));
			process.exit(1);
		}

		// Scan all workspaces
		foundImports = await scanWorkspacesForWordPressImports(monorepoRoot, workspaceDirs);
	} else {
		console.log(`Scanning for @wordpress/* imports...`);
		foundImports = await scanForWordPressImports(cwd);
		installDir = cwd;
	}

	if (foundImports.size === 0) {
		console.log(pc.yellow('\nNo @wordpress/* imports found in source files.'));
		return;
	}

	console.log(`\nFound ${pc.bold(String(foundImports.size))} unique @wordpress packages:\n`);

	// Sort for consistent output
	const sortedImports = Array.from(foundImports).sort();
	for (const pkg of sortedImports) {
		console.log(`  ${pc.dim('•')} ${pkg}`);
	}

	// Read package.json from install directory
	const packageJson = readPackageJson(installDir);
	const existingDeps = getExistingWpDeps(packageJson);

	// Determine what needs to be installed
	const toInstall: string[] = [];
	const alreadyInstalled: string[] = [];

	for (const pkg of sortedImports) {
		if (existingDeps.has(pkg)) {
			alreadyInstalled.push(pkg);
		} else {
			toInstall.push(pkg);
		}
	}

	if (toInstall.length === 0) {
		console.log(pc.green('\nAll @wordpress packages are already installed as optional dependencies.'));
		return;
	}

	console.log(`\nPackages to install with tag ${pc.cyan(tag)}:`);
	for (const pkg of toInstall) {
		console.log(`  ${pc.green('+')} ${pkg}@${tag}`);
	}

	if (alreadyInstalled.length > 0) {
		console.log(`\nAlready installed (${alreadyInstalled.length} packages):`);
		for (const pkg of alreadyInstalled) {
			console.log(`  ${pc.dim('•')} ${pkg}@${existingDeps.get(pkg)}`);
		}
	}

	if (workspaceScan) {
		console.log(`\n${pc.dim('Installing at monorepo root:')} ${installDir}`);
	}

	if (dryRun) {
		console.log(pc.yellow('\nDry run - no changes made.'));
		console.log(`Run without --dry-run to install packages.`);
		return;
	}

	// Install packages
	console.log(`\nInstalling ${toInstall.length} packages...`);

	const installCmd = `npm install --save-optional ${toInstall.map(p => `${p}@${tag}`).join(' ')}`;

	try {
		execSync(installCmd, { cwd: installDir, stdio: 'inherit' });
		console.log(pc.green('\n✓ WordPress dependencies synced successfully!'));
	} catch (error) {
		throw new Error('Failed to install packages. Check npm output above.');
	}
}

/**
 * Update @wordpress dependencies to a new tag
 *
 * Updates all @wordpress/* packages in optionalDependencies
 * to the specified WordPress version tag.
 */
export async function updateWpDeps(options: { tag: string; dryRun?: boolean }): Promise<void> {
	const cwd = process.cwd();
	const { tag, dryRun = false } = options;

	console.log(pc.cyan('\n10up-build') + ' - Update WordPress Dependencies\n');

	// Read current package.json
	const packageJson = readPackageJson(cwd);
	const existingDeps = getExistingWpDeps(packageJson);

	if (existingDeps.size === 0) {
		console.log(pc.yellow('No @wordpress packages found in optionalDependencies.'));
		console.log(`Run ${pc.cyan('10up-build sync-wp-deps')} first to add WordPress dependencies.`);
		return;
	}

	console.log(`Found ${pc.bold(String(existingDeps.size))} @wordpress packages to update:\n`);

	const sortedDeps = Array.from(existingDeps.entries()).sort((a, b) => a[0].localeCompare(b[0]));

	for (const [pkg, currentVersion] of sortedDeps) {
		console.log(`  ${pkg}: ${pc.dim(currentVersion)} → ${pc.green(tag)}`);
	}

	if (dryRun) {
		console.log(pc.yellow('\nDry run - no changes made.'));
		console.log(`Run without --dry-run to update packages.`);
		return;
	}

	// Update packages
	console.log(`\nUpdating to ${pc.cyan(tag)}...`);

	const packages = sortedDeps.map(([pkg]) => `${pkg}@${tag}`);
	const installCmd = `npm install --save-optional ${packages.join(' ')}`;

	try {
		execSync(installCmd, { cwd, stdio: 'inherit' });
		console.log(pc.green('\n✓ WordPress dependencies updated successfully!'));
	} catch (error) {
		throw new Error('Failed to update packages. Check npm output above.');
	}
}

/**
 * List current @wordpress dependencies
 */
export async function listWpDeps(): Promise<void> {
	const cwd = process.cwd();

	console.log(pc.cyan('\n10up-build') + ' - WordPress Dependencies\n');

	// Read current package.json
	const packageJson = readPackageJson(cwd);
	const existingDeps = getExistingWpDeps(packageJson);

	if (existingDeps.size === 0) {
		console.log(pc.yellow('No @wordpress packages found in optionalDependencies.'));
		console.log(`Run ${pc.cyan('10up-build sync-wp-deps')} to add WordPress dependencies.`);
		return;
	}

	console.log(`Installed @wordpress packages (${existingDeps.size}):\n`);

	const sortedDeps = Array.from(existingDeps.entries()).sort((a, b) => a[0].localeCompare(b[0]));

	for (const [pkg, version] of sortedDeps) {
		console.log(`  ${pc.dim('•')} ${pkg}@${pc.cyan(version)}`);
	}

	// Also scan for imports and show any missing
	console.log(`\nScanning source files for imports...`);
	const foundImports = await scanForWordPressImports(cwd);

	const missing = Array.from(foundImports).filter(pkg => !existingDeps.has(pkg)).sort();

	if (missing.length > 0) {
		console.log(pc.yellow(`\nMissing packages (${missing.length}):`));
		for (const pkg of missing) {
			console.log(`  ${pc.red('!')} ${pkg}`);
		}
		console.log(`\nRun ${pc.cyan('10up-build sync-wp-deps')} to install missing packages.`);
	} else {
		console.log(pc.green('\nAll imported @wordpress packages are installed.'));
	}
}

/**
 * Cache wpScript values from installed @wordpress/* packages
 *
 * Scans all installed @wordpress/* packages in node_modules and caches
 * their wpScript boolean values to a JSON file. This allows CI environments
 * to skip installing optional dependencies while still having accurate
 * wpScript information for the build.
 *
 * The cache file should be committed to the repository so it's available
 * in CI environments that use --omit=optional.
 */
export async function cacheWpScripts(options: { output?: string } = {}): Promise<void> {
	const cwd = process.cwd();
	const outputPath = options.output || join(cwd, WP_SCRIPTS_CACHE_FILE);

	console.log(pc.cyan('\n10up-build') + ' - Cache WordPress Script Flags\n');

	// Find all installed @wordpress/* packages
	const wpPackagesDir = join(cwd, 'node_modules', '@wordpress');

	if (!existsSync(wpPackagesDir)) {
		console.error(pc.red('Error: No @wordpress packages found in node_modules.'));
		console.log(pc.dim('Install @wordpress/* packages first, then run this command.'));
		process.exit(1);
	}

	// Get all package directories
	const packageDirs = await fg(['*'], {
		cwd: wpPackagesDir,
		onlyDirectories: true,
		absolute: false,
	});

	if (packageDirs.length === 0) {
		console.error(pc.red('Error: No @wordpress packages found in node_modules/@wordpress.'));
		process.exit(1);
	}

	console.log(`Found ${pc.bold(String(packageDirs.length))} @wordpress packages in node_modules.\n`);

	const cache: Record<string, boolean> = {};
	let withWpScript = 0;
	let withoutWpScript = 0;

	for (const dir of packageDirs.sort()) {
		const packageName = `@wordpress/${dir}`;
		const pkgJsonPath = join(wpPackagesDir, dir, 'package.json');

		try {
			const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));
			const hasWpScript = pkgJson.wpScript === true;
			cache[packageName] = hasWpScript;

			if (hasWpScript) {
				withWpScript++;
				console.log(`  ${pc.green('✓')} ${packageName} ${pc.dim('(wpScript: true)')}`);
			} else {
				withoutWpScript++;
				console.log(`  ${pc.dim('•')} ${packageName}`);
			}
		} catch {
			console.log(`  ${pc.yellow('?')} ${packageName} ${pc.dim('(could not read package.json)')}`);
		}
	}

	// Write cache file
	const cacheData = {
		_comment: 'Auto-generated by 10up-build cache-wp-scripts. Do not edit manually.',
		packages: cache,
	};

	writeFileSync(outputPath, JSON.stringify(cacheData, null, 2) + '\n');

	console.log(`\n${pc.bold('Summary:')}`);
	console.log(`  ${pc.green(String(withWpScript))} packages with wpScript: true`);
	console.log(`  ${pc.dim(String(withoutWpScript))} packages without wpScript`);
	console.log(`\n${pc.green('✓')} Cache written to ${pc.cyan(outputPath)}`);
	console.log(pc.dim('\nCommit this file to your repository so CI can use it with --omit=optional.'));
}
