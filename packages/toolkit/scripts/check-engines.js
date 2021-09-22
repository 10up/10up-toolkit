/**
 * External dependencies
 */
const { sync: resolveBin } = require('resolve-bin');
const { sync: spawn } = require('../compiled/cross-spawn');

/**
 * Internal dependencies
 */
const { getArgsFromCLI, hasArgInCLI } = require('../utils');

function checkEngines() {
	const args = getArgsFromCLI();

	const hasConfig =
		hasArgInCLI('--package') ||
		hasArgInCLI('--node') ||
		hasArgInCLI('--npm') ||
		hasArgInCLI('--yarn');
	const config = !hasConfig ? ['--node', '>=10.0.0', '--npm', '>=6.9.0'] : [];

	const result = spawn(resolveBin('check-node-version'), [...config, ...args], {
		stdio: 'inherit',
	});

	process.exit(result.status);
}

module.exports = checkEngines;
