#!/usr/bin/env node

/**
 * Internal dependencies
 */
const { getNodeArgsFromCLI, getPackageVersion, hasArgInCLI } = require('../utils');
const { exit } = require('../utils/process');

const build = require('../scripts/build');
const checkEngines = require('../scripts/check-engines');
const lintJs = require('../scripts/lint-js');
const lintStyle = require('../scripts/lint-style');
const start = require('../scripts/start');
const testUnitJest = require('../scripts/test-unit-jest');
const formatJs = require('../scripts/format-js');

const { scriptName, scriptArgs } = getNodeArgsFromCLI();

// disable webpack 5 deprecation warnings as some plugins still need to catch up
process.env.NODE_OPTIONS = '--no-deprecation';

(async () => {
	if (scriptArgs.includes('--version') || (scriptArgs.includes('-v') && !scriptName)) {
		const version = await getPackageVersion();
		// eslint-disable-next-line no-console
		console.log('Version:', version);
		exit(0);
	}

	// spawnScript(scriptName, scriptArgs, nodeArgs);
	process.argv = [process.argv[0], scriptName, ...scriptArgs];

	switch (scriptName) {
		case 'build':
			if (hasArgInCLI('--watch')) {
				start();
			} else {
				build();
			}

			break;
		case 'start':
		case 'watch':
			start();
			break;
		case 'check-engines':
			checkEngines();
			break;
		case 'format-js':
			formatJs();
			break;
		case 'lint-js':
			lintJs();
			break;
		case 'lint-style':
			lintStyle();
			break;
		case 'test-unit-jest':
		case 'test-unit-js':
			testUnitJest();
			break;
		default:
			start();
			break;
	}
})();
