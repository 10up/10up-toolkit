const getEntryPoints = require('./entry');
const getOutput = require('./output');
const getExternals = require('./externals');
const getPlugins = require('./plugins');
const getStats = require('./stats');
const getOptimization = require('./optimization');
const getModules = require('./modules');
const getResolve = require('./resolve');
const getTarget = require('./target');
const getPerformance = require('./performance');
const getDevServer = require('./devServer');

module.exports = {
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
};
