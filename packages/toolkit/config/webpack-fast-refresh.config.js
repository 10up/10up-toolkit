const { resolve, join } = require('path');
const DependencyExtractionWebpackPlugin = require('@wordpress/dependency-extraction-webpack-plugin');
const { isRspack } = require('./bundler');

const sharedConfig = {
	mode: 'development',
	output: {
		filename: '[name]/index.min.js',
		path: resolve(process.cwd(), join('dist', 'fast-refresh')),
	},
};

// When using RSPack, we need to use the RSPack-specific react refresh entry
const getReactRefreshEntryPath = () => {
	if (isRspack()) {
		// RSPack's react refresh plugin has its own entry
		// We can use the standard react-refresh/runtime directly
		return require.resolve('react-refresh/runtime');
	}
	return require.resolve('@pmmmwh/react-refresh-webpack-plugin/client/ReactRefreshEntry.js');
};

module.exports = [
	{
		...sharedConfig,
		name: 'react-refresh-entry',
		entry: {
			'react-refresh-entry': getReactRefreshEntryPath(),
		},
		plugins: [new DependencyExtractionWebpackPlugin()],
	},
	{
		...sharedConfig,
		name: 'react-refresh-runtime',
		entry: {
			'react-refresh-runtime': {
				import: 'react-refresh/runtime',
				library: {
					name: 'ReactRefreshRuntime',
					type: 'window',
				},
			},
		},
		plugins: [
			new DependencyExtractionWebpackPlugin({
				useDefaults: false,
			}),
		],
	},
];
