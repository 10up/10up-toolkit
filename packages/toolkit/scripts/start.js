/**
 * External dependencies
 */
const rspack = require('@rspack/core');
const { RspackDevServer } = require('@rspack/dev-server');
const fs = require('fs');

/**
 * Internal dependencies
 */
const {
	hasArgInCLI,
	fromConfigRoot,
	fromProjectRoot,
	hasProjectFile,
	displayWebpackStats: displayBuildStats,
} = require('../utils');

if (hasArgInCLI('--webpack-no-externals')) {
	process.env.TENUP_NO_EXTERNALS = true;
}

// Resolve config: project-level rspack/webpack config takes precedence
let configPath = fromConfigRoot('rspack.config.js');

if (hasProjectFile('rspack.config.js')) {
	configPath = fromProjectRoot('rspack.config.js');
} else if (hasProjectFile('webpack.config.js')) {
	console.warn(
		'\n⚠️  10up-toolkit v7 uses rspack. Rename your webpack.config.js to rspack.config.js.\n' +
			'   See the migration guide: https://github.com/10up/10up-toolkit/blob/trunk/MIGRATION.md\n',
	);
	configPath = fromProjectRoot('webpack.config.js');
}

let server;
let compiler;

const runRspack = () => {
	const config = require(configPath);
	compiler = rspack(config);

	const { devServer } = config;

	if (devServer) {
		const devServerOptions = { ...devServer, host: '127.0.0.1', open: false };
		server = new RspackDevServer(devServerOptions, compiler);

		server.start();
	} else {
		compiler.watch(
			{
				aggregateTimeout: 600,
			},
			(err, stats) => {
				displayBuildStats(err, stats);
			},
		);
	}
};

const hot = hasArgInCLI('--hot');

if (hot) {
	// compile the fast refresh bundle
	const config = require(fromConfigRoot('rspack-fast-refresh.config.js'));
	const compiler = rspack(config);
	compiler.run((err, stats) => {
		displayBuildStats(err, stats);

		compiler.close((closedErr) => {
			if (closedErr) {
				// eslint-disable-next-line no-console
				console.error(closedErr);
			} else {
				// we can only call runRspack after the compiler has closed
				runRspack();
			}
		});
	});
} else {
	runRspack();
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
