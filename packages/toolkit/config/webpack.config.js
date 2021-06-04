/**
 * Internal dependencies
 */
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

const defaultTargets = ['> 1%', 'ie >= 11', 'Firefox ESR', 'last 2 versions'];

const config = {
	projectConfig,
	packageConfig,
	buildFiles,
	isPackage,
	mode,
	isProduction,
	defaultTargets,
};

module.exports = {
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
};
