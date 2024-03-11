const { resolve, join } = require('path');
const DependencyExtractionWebpackPlugin = require('@wordpress/dependency-extraction-webpack-plugin');

const sharedConfig = {
	mode: 'development',
	output: {
		filename: '[name]/index.min.js',
		path: resolve(process.cwd(), join('dist', 'fast-refresh')),
	},
};

module.exports = [
	{
		...sharedConfig,
		name: 'react-refresh-entry',
		entry: {
			'react-refresh-entry': require.resolve(
				'@pmmmwh/react-refresh-webpack-plugin/client/ReactRefreshEntry.js',
			),
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
