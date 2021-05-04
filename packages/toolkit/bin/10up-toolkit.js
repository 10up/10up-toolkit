#!/usr/bin/env node

/**
 * Internal dependencies
 */
const { getNodeArgsFromCLI, spawnScript, getPackageVersion } = require('../utils');
const { exit } = require('../utils/process');

const { scriptName, scriptArgs, nodeArgs } = getNodeArgsFromCLI();

// disable webpack 5 deprecation warnings as some plugins still need to catch up
process.env.NODE_OPTIONS = '--no-deprecation';

(async () => {
	if (scriptArgs.includes('--version') || (scriptArgs.includes('-v') && !scriptName)) {
		const version = await getPackageVersion();
		// eslint-disable-next-line no-console
		console.log('Version:', version);
		exit(0);
	}

	spawnScript(scriptName, scriptArgs, nodeArgs);
})();
