#!/usr/bin/env node

/**
 * Internal dependencies
 */
const { getNodeArgsFromCLI, spawnScript, getPackage } = require('../utils');
const { exit } = require('../utils/process');

const { scriptName, scriptArgs, nodeArgs } = getNodeArgsFromCLI();

if (scriptArgs.includes('--version') || (scriptArgs.includes('-v') && !scriptName)) {
	const pkg = getPackage();
	// eslint-disable-next-line no-console
	console.log('Version:', pkg.version);
	exit(0);
}

spawnScript(scriptName, scriptArgs, nodeArgs);
