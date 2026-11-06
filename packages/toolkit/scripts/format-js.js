/**
 * `10up-toolkit format-js` — format JavaScript and TypeScript with Oxfmt.
 *
 * - A project with its own `vite.config.*` runs `vp fmt`, which reads the
 *   `fmt` block of that config.
 * - Otherwise Oxfmt runs with the project's `.oxfmtrc.json`, or with
 *   toolkit's default config (`config/oxfmtrc.json`, the 10up house style).
 * - A project that still carries an ESLint config and installs `eslint`
 *   itself keeps running `eslint --fix`, as toolkit 7 did.
 */
const { sync: spawn } = require('cross-spawn');
const path = require('path');

const {
	fromConfigRoot,
	fromProjectRoot,
	getArgsFromCLI,
	hasFileArgInCLI,
	hasEslintConfig,
	hasOxfmtConfig,
} = require('../utils');
const {
	getVitePlusBin,
	getVitePlusToolBin,
	hasViteConfig,
	resolveFromProject,
} = require('../utils/vite');

const args = getArgsFromCLI();
const files = hasFileArgInCLI() ? [] : ['.'];
const cwd = path.dirname(fromProjectRoot('package.json'));

const run = (bin, binArgs) => spawn(bin, binArgs, { stdio: 'inherit', cwd }).status;

let status;
const eslintPackage = hasEslintConfig() && resolveFromProject('eslint/package.json');

if (eslintPackage) {
	// eslint-disable-next-line no-console
	console.log(
		'10up-toolkit: running ESLint because this project has an ESLint config. ' +
			'Remove it to format with Oxfmt.',
	);
	status = run(path.join(path.dirname(eslintPackage), 'bin', 'eslint.js'), [
		'--fix',
		...args,
		...files,
	]);
} else if (hasViteConfig()) {
	status = run(getVitePlusBin(), ['fmt', ...args]);
} else {
	const configArgs = hasOxfmtConfig() ? [] : ['-c', fromConfigRoot('oxfmtrc.json')];
	status = run(getVitePlusToolBin('oxfmt'), [...configArgs, ...args, ...files]);
}

process.exit(status ?? 1);
