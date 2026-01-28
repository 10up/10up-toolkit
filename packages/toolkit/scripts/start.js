/**
 * External dependencies
 */
const fs = require('fs');
const { getBundler, getDevServer, getBundlerType } = require('../config/bundler');

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

const runBundler = () => {
	const config = require(configPath);
	const bundler = getBundler();
	const DevServer = getDevServer();

	compiler = bundler(config);

	// Log which bundler is being used
	const bundlerType = getBundlerType();
	if (bundlerType === 'rspack') {
		// eslint-disable-next-line no-console
		console.log('10up-toolkit: Using RSPack for faster builds');
	}

	const { devServer } = config;

	if (devServer) {
		const devServerOptions = { ...devServer, host: '127.0.0.1', open: false };
		server = new DevServer(devServerOptions, compiler);

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
	const bundler = getBundler();
	const config = require(fromConfigRoot('webpack-fast-refresh.config.js'));
	const fastRefreshCompiler = bundler(config);

	fastRefreshCompiler.run((err, stats) => {
		displayWebpackStats(err, stats);

		fastRefreshCompiler.close((closedErr) => {
			if (closedErr) {
				// eslint-disable-next-line no-console
				console.error(closedErr);
			} else {
				// we can only call runBundler after the compiler has closed
				runBundler();
			}
		});
	});
} else {
	runBundler();
}

process.on('SIGINT', () => {
	if (server) {
		server.close(() => {});
	}

	compiler.close();

	if (hot) {
		// when gracefully leaving hot mode, clean up dist folder.
		// this avoids leaving js code with the fast refresh instrumentation and thus reducing confusion
		console.log('\n10up-toolkit: Cleaning up dist folder...');

		fs.rmSync(fromProjectRoot('dist'), { recursive: true, force: true });
	}
});
