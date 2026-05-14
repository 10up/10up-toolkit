const { resolve, join } = require('path');
const RspackDependencyExtractionPlugin = require('./rspack/plugins/dependency-extraction');

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
			'react-refresh-entry':
				require.resolve('@rspack/plugin-react-refresh/react-refresh-entry'),
		},
		plugins: [new RspackDependencyExtractionPlugin()],
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
			new RspackDependencyExtractionPlugin({
				useDefaults: false,
			}),
		],
	},
];
