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

const runWebpack = () => {
	const config = require(configPath);
	const compiler = webpack(config);

	const { devServer } = config;

	if (devServer) {
		const devServerOptions = { ...devServer, open: false };

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
};

const hot = hasArgInCLI('--hot');

if (hot) {
	// compile the fast refresh bundle
	const config = require(fromConfigRoot('webpack-fast-refresh.config.js'));
	const compiler = webpack(config);
	compiler.run((err, stats) => {
		displayWebpackStats(err, stats);

		compiler.close((closedErr) => {
			if (closedErr) {
				// eslint-disable-next-line no-console
				console.error(closedErr);
			} else {
				// we can only call runWebpack after the compiler has closed
				runWebpack();
			}
		});
	});
} else {
	runWebpack();
}
