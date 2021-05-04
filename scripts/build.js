/**
 * External dependencies
 */
const webpack = require('webpack');

/**
 * Internal dependencies
 */
const {
	hasArgInCLI,
	fromConfigRoot,
	fromProjectRoot,
	hasWebpackConfig,
	displayWebpackStats,
} = require('../utils');

process.env.NODE_ENV = process.env.NODE_ENV || 'production';

if (hasArgInCLI('--webpack-no-externals')) {
	process.env.WP_NO_EXTERNALS = true;
}

if (hasArgInCLI('--webpack-bundle-analyzer')) {
	process.env.WP_BUNDLE_ANALYZER = true;
}

let configPath = fromConfigRoot('webpack.config.js');

if (hasWebpackConfig()) {
	configPath = fromProjectRoot('webpack.config.js');
}

const config = require(configPath);

const compiler = webpack(config);

compiler.run((err, stats) => {
	displayWebpackStats(err, stats);

	compiler.close((closedErr) => {
		if (closedErr) {
			console.error(closedErr);
		}
	});
});
