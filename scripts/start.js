/**
 * External dependencies
 */
const { sync: spawn } = require('cross-spawn');
const { sync: resolveBin } = require('resolve-bin');

/**
 * Internal dependencies
 */
const { getArgFromCLI, getWebpackArgs, hasArgInCLI } = require('../utils');

if (hasArgInCLI('--webpack-no-externals')) {
	process.env.TENUP_NO_EXTERNALS = true;
}

if (hasArgInCLI('--webpack-bundle-analyzer')) {
	process.env.TENUP_BUNDLE_ANALYZER = true;
}

if (hasArgInCLI('--webpack--devtool')) {
	process.env.TENUP_DEVTOOL = getArgFromCLI('--webpack--devtool');
}

process.env.NODE_ENV = 'development';
// disable webpack 5 deprecation warnings as some plugins still need to catch up
process.env.NODE_OPTIONS = '--no-deprecation';
const { status } = spawn(resolveBin('webpack'), [...getWebpackArgs(), '--watch'], {
	stdio: 'inherit',
});
process.exit(status);
