/**
 * External dependencies
 */
const spawn = require('cross-spawn');
const webpack = require('webpack');
const { sync: resolveBin } = require('resolve-bin');

/**
 * Internal dependencies
 */
const {
	hasArgInCLI,
	fromConfigRoot,
	fromProjectRoot,
	hasWebpackConfig,
	displayWebpackStats,
	hasTsConfig,
} = require('../utils');

if (hasArgInCLI('--watch')) {
	require('./watch');
	return;
}

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

	if (err || stats.hasErrors()) {
		process.exit(1);
	}

	// run tsc
	if (hasTsConfig()) {
		const result = spawn(
			resolveBin('typescript', { executable: 'tsc' }),
			['--project', fromProjectRoot('tsconfig.json'), '--outDir', fromProjectRoot('dist')],
			{
				stdio: 'inherit',
			},
		);
		process.exit(result.status);
	}
});
