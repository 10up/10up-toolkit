/**
 * External dependencies
 */
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');

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

if (hasArgInCLI('--webpack-no-externals')) {
	process.env.TENUP_NO_EXTERNALS = true;
}

let configPath = fromConfigRoot('webpack.config.js');

if (hasWebpackConfig()) {
	configPath = fromProjectRoot('webpack.config.js');
}

const config = require(configPath);

const compiler = webpack(config);

const { devServer } = config[0];

if (devServer) {
	const devServerOptions = { ...devServer, open: false };
	console.log(devServerOptions);
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
