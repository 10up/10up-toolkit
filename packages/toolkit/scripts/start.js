/**
 * External dependencies
 */
const WebpackDevServer = require('webpack-dev-server');
const webpack = require('../compiled/webpack');

/**
 * Internal dependencies
 */
const {
	hasArgInCLI,
	fromConfigRoot,
	fromProjectRoot,
	hasWebpackConfig,
	getArgFromCLI,
	displayWebpackStats,
} = require('../utils');

function start() {
	if (hasArgInCLI('--webpack-no-externals')) {
		process.env.TENUP_NO_EXTERNALS = true;
	}

	if (hasArgInCLI('--webpack-bundle-analyzer')) {
		process.env.TENUP_BUNDLE_ANALYZER = true;
	}

	if (hasArgInCLI('--webpack--devtool')) {
		process.env.TENUP_DEVTOOL = getArgFromCLI('--webpack--devtool');
	}

	let configPath = fromConfigRoot('webpack.config.js');

	if (hasWebpackConfig()) {
		configPath = fromProjectRoot('webpack.config.js');
	}

	const config = require(configPath);

	const compiler = webpack(config);

	if (config.devServer) {
		const devServerOptions = { ...config.devServer, open: true };
		const server = new WebpackDevServer(compiler, devServerOptions);

		server.listen(devServerOptions.port, '127.0.0.1');
	} else {
		compiler.watch(
			{
				aggregateTimeout: 600,
			},
			(err, stats) => {
				displayWebpackStats(err, stats);
			},
		);
	}
}

module.exports = start;
