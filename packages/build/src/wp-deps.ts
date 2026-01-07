/**
 * WordPress dependency management utilities
 *
 * Provides commands to sync and update @wordpress/* dependencies
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';
import pc from 'picocolors';
import fg from 'fast-glob';

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
 * Sync @wordpress dependencies
 *
 * Scans source files for @wordpress/* imports and installs them
 * as optional dependencies using the specified WordPress version tag.
 */
export async function syncWpDeps(options: { tag?: string; dryRun?: boolean } = {}): Promise<void> {
	const cwd = process.cwd();
	const dryRun = options.dryRun || false;

	console.log(pc.cyan('\n10up-build') + ' - Sync WordPress Dependencies\n');

	// Get tag from options or fetch latest from WordPress API
	let tag = options.tag;
	if (!tag) {
		console.log(`Fetching latest WordPress version...`);
		tag = await getLatestWpTag();
		console.log(`Using tag: ${pc.cyan(tag)}\n`);
	}

	console.log(`Scanning for @wordpress/* imports...`);

	// Scan for imports
	const foundImports = await scanForWordPressImports(cwd);

	if (foundImports.size === 0) {
		console.log(pc.yellow('\nNo @wordpress/* imports found in source files.'));
		return;
	}

	console.log(`Found ${pc.bold(String(foundImports.size))} @wordpress packages:\n`);

	// Sort for consistent output
	const sortedImports = Array.from(foundImports).sort();
	for (const pkg of sortedImports) {
		console.log(`  ${pc.dim('•')} ${pkg}`);
	}

	// Read current package.json
	const packageJson = readPackageJson(cwd);
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

	if (dryRun) {
		console.log(pc.yellow('\nDry run - no changes made.'));
		console.log(`Run without --dry-run to install packages.`);
		return;
	}

	// Install packages
	console.log(`\nInstalling ${toInstall.length} packages...`);

	const installCmd = `npm install --save-optional ${toInstall.map(p => `${p}@${tag}`).join(' ')}`;

	try {
		execSync(installCmd, { cwd, stdio: 'inherit' });
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
