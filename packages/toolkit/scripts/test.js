/**
 * `10up-toolkit test` — run unit tests with Vitest (`vp test run`).
 *
 * Without a `vite.config.*` or `vitest.config.*` in the project, toolkit's
 * default config (`config/vitest.config.mjs`) is used: the jsdom
 * environment, Jest-style globals, and the test file patterns toolkit 7
 * looked for. Pass `--watch` to keep watching.
 */
const { sync: spawn } = require('cross-spawn');
const path = require('path');

const { fromConfigRoot, fromProjectRoot, getArgsFromCLI, hasProjectFile } = require('../utils');
const { getVitePlusBin, hasViteConfig } = require('../utils/vite');

process.env.NODE_ENV = process.env.NODE_ENV || 'test';

const args = getArgsFromCLI();
const watch = args.includes('--watch');
const passArgs = args.filter((arg) => arg !== '--watch');

const hasVitestConfig = [
	'vitest.config.ts',
	'vitest.config.mts',
	'vitest.config.js',
	'vitest.config.mjs',
].some((file) => hasProjectFile(file));
const configArgs =
	hasViteConfig() || hasVitestConfig ? [] : ['--config', fromConfigRoot('vitest.config.mjs')];

const { status } = spawn(
	getVitePlusBin(),
	['test', ...(watch ? [] : ['run']), ...configArgs, ...passArgs],
	{ stdio: 'inherit', cwd: path.dirname(fromProjectRoot('package.json')) },
);

process.exit(status ?? 1);
