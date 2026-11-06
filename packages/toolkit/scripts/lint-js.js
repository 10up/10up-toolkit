/**
 * `10up-toolkit lint-js` — lint JavaScript and TypeScript with Oxlint.
 *
 * - A project with its own `vite.config.*` runs `vp lint`, which reads the
 *   `lint` block of that config.
 * - Otherwise Oxlint runs with the project's `.oxlintrc.json`, or with
 *   toolkit's default config (`config/oxlintrc.json`).
 * - A project that still carries an ESLint config and installs `eslint`
 *   itself keeps running ESLint, so the upgrade does not change its rules.
 */
const { sync: spawn } = require('cross-spawn');
const path = require('path');

const {
	fromConfigRoot,
	fromProjectRoot,
	getArgsFromCLI,
	hasFileArgInCLI,
	hasEslintConfig,
	hasOxlintConfig,
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
			'Remove it to lint with Oxlint.',
	);
	status = run(path.join(path.dirname(eslintPackage), 'bin', 'eslint.js'), [...args, ...files]);
} else if (hasViteConfig()) {
	status = run(getVitePlusBin(), ['lint', ...args]);
} else {
	const configArgs = hasOxlintConfig() ? [] : ['-c', fromConfigRoot('oxlintrc.json')];
	status = run(getVitePlusToolBin('oxlint'), [...configArgs, ...args, ...files]);
}

process.exit(status ?? 1);
