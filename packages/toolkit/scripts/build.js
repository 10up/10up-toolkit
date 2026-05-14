/**
 * External dependencies
 */

const rspack = require('@rspack/core');

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

if (hasArgInCLI('--watch')) {
	require('./start');
} else {
	process.env.NODE_ENV = process.env.NODE_ENV || 'production';

	// Resolve config: project-level rspack/webpack config takes precedence,
	// otherwise fall back to the toolkit's built-in rspack config.
	let configPath = fromConfigRoot('rspack.config.js');

	if (hasProjectFile('rspack.config.js')) {
		configPath = fromProjectRoot('rspack.config.js');
	} else if (hasProjectFile('webpack.config.js')) {
		// Legacy support: warn and use webpack.config.js if present
		console.warn(
			'\n⚠️  10up-toolkit v7 uses rspack. Rename your webpack.config.js to rspack.config.js.\n' +
				'   See the migration guide: https://github.com/10up/10up-toolkit/blob/trunk/MIGRATION.md\n',
		);
		configPath = fromProjectRoot('webpack.config.js');
	}

	const config = require(configPath);
	const compiler = rspack(config);

	compiler.run((err, stats) => {
		displayBuildStats(err, stats);

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
