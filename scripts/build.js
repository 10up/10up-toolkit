/**
 * External dependencies
 */
const { sync: spawn } = require('cross-spawn');
const { sync: resolveBin } = require('resolve-bin');

/**
 * Internal dependencies
 */
const { getWebpackArgs, hasArgInCLI } = require('../utils');

process.env.NODE_ENV = process.env.NODE_ENV || 'production';

if (hasArgInCLI('--webpack-no-externals')) {
	process.env.WP_NO_EXTERNALS = true;
}

if (hasArgInCLI('--webpack-bundle-analyzer')) {
	process.env.WP_BUNDLE_ANALYZER = true;
}

// disable webpack 5 deprecation warnings as some plugins still need to catch up
process.env.NODE_OPTIONS = '--no-deprecation';

const { status } = spawn(resolveBin('webpack'), getWebpackArgs(), {
	stdio: 'inherit',
});
process.exit(status);
