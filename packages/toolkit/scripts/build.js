/**
 * External dependencies
 */
const { getBundler, getBundlerType } = require('../config/bundler');

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
	const bundler = getBundler();
	const compiler = bundler(config);

	// Log which bundler is being used
	const bundlerType = getBundlerType();
	if (bundlerType === 'rspack') {
		// eslint-disable-next-line no-console
		console.log('10up-toolkit: Using RSPack for faster builds');
	}

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
