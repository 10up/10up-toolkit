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

if (hasArgInCLI('--watch')) {
	require('./start');
} else {
	process.env.NODE_ENV = process.env.NODE_ENV || 'production';

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
				// eslint-disable-next-line no-console
				console.error(closedErr);
			}
		});

		if (err || stats.hasErrors()) {
			process.exit(1);
		}
	});
}
