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
	getPerformance,
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

module.exports = {
	devtool: isProduction ? false : 'source-map',
	mode,
	devServer: getDevServer(config),
	// using a function here in order to re-evaluate
	// the entrypoints whenever something changes
	entry: () => getEntryPoints(config),
	output: getOutput(config),
	target: getTarget(config),
	resolve: getResolve(config),
	externals: getExternals(config),
	performance: getPerformance(config),
	module: getModules(config),
	plugins: getPlugins(config),
	stats: getStats(config),
	optimization: getOptimization(config),
	experiments: {
		outputModule: packageConfig.packageType === 'module',
	},
};
