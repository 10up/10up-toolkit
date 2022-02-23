const { resolve, join } = require('path');
const DependencyExtractionWebpackPlugin = require('@wordpress/dependency-extraction-webpack-plugin');

module.exports = {
	mode: 'development',
	output: {
		filename: '[name]/index.min.js',
		path: resolve(process.cwd(), join('dist', 'fast-refresh')),
	},
	name: 'react-refresh-runtime',
	entry: {
		'react-refresh-runtime': {
			import: 'react-refresh/runtime.js',
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
};
