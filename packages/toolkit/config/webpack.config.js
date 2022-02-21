/**
 * Internal dependencies
 */
const { resolve, join } = require('path');
const DependencyExtractionWebpackPlugin = require('@wordpress/dependency-extraction-webpack-plugin');
const {
	getBuildFiles,
	getTenUpScriptsConfig,
	getTenUpScriptsPackageBuildConfig,
} = require('../utils');

const {
	getEntryPoints,
	getOutput,
	getExternals,
	getPlugins,
	getStats,
	getOptimization,
	getModules,
	getResolve,
	getTarget,
	getPerfomance,
	getDevServer,
} = require('./webpack');

const projectConfig = getTenUpScriptsConfig();
const packageConfig = getTenUpScriptsPackageBuildConfig();

const { source, main } = packageConfig;
const buildFiles = getBuildFiles();

// assume it's a package if there's source and main
const isPackage = typeof source !== 'undefined' && typeof main !== 'undefined';
const isProduction = process.env.NODE_ENV === 'production';
const mode = isProduction ? 'production' : 'development';

const defaultTargets = [
	'> 1%',
	'Firefox ESR',
	'last 2 versions',
	'not ie <= 11',
	'not ie_mob <=11',
];

const config = {
	projectConfig,
	packageConfig,
	buildFiles,
	isPackage,
	mode,
	isProduction,
	defaultTargets,
};

const hasReactFastRefresh = projectConfig.hot && !isProduction;

const sharedConfig = {
	mode: 'development',
	target: getTarget(config),
	output: {
		filename: '[name]/index.min.js',
		path: resolve(process.cwd(), join('dist', 'fast-refresh')),
	},
};

const ReactRefreshConfig = hasReactFastRefresh
	? [
			{
				...sharedConfig,
				name: 'react-refresh-entry',
				entry: {
					'react-refresh-entry':
						'@pmmmwh/react-refresh-webpack-plugin/client/ReactRefreshEntry.js',
				},
				plugins: [new DependencyExtractionWebpackPlugin()],
			},
			{
				...sharedConfig,
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
			},
	  ]
	: [];

module.exports = [
	{
		devtool: isProduction ? false : 'source-map',
		mode,
		devServer: getDevServer(config),
		entry: getEntryPoints(config),
		output: getOutput(config),
		target: getTarget(config),
		resolve: getResolve(config),
		externals: getExternals(config),
		performance: getPerfomance(config),
		module: getModules(config),
		plugins: getPlugins(config),
		stats: getStats(config),
		optimization: getOptimization(config),
	},
	...ReactRefreshConfig,
];
