/**
 * External dependencies
 */
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const fs = require('fs');

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

let server;
let compiler;

const runWebpack = () => {
	const config = require(configPath);
	compiler = webpack(config);

	const { devServer } = config;

	if (devServer) {
		const devServerOptions = { ...devServer, host: '127.0.0.1', open: false };
		server = new WebpackDevServer(devServerOptions, compiler);

		server.start();
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

process.on('SIGINT', () => {
	if (server) {
		server.close();
	}

	compiler.close();

	// when gracefully leaving hot mode, clean up dist folder.
	// this avoids leaving js code with the fast refresh instrumentation and thus reducing confusion
	console.log('\n10up-toolkit: Cleaning up dist folder...');

	fs.rmSync(fromProjectRoot('dist'), { recursive: true, force: true });
});
