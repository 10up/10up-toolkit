const { getJsMinimizer, getImageMinimizers } = require('../bundler');
const { fromProjectRoot, hasProjectFile } = require('../../utils');

module.exports = ({ isProduction, projectConfig: { hot, analyze } }) => {
	return {
		concatenateModules: isProduction && !analyze,
		runtimeChunk: hot ? 'single' : false,
		minimizer: [
			// Use bundler-appropriate JS minimizer (RSPack uses SWC, webpack uses Terser)
			...getJsMinimizer(),
			// Use bundler-appropriate image minimizers (RSPack skips image optimization due to plugin incompatibility)
			...getImageMinimizers({ hasProjectFile, fromProjectRoot }),
		],
	};
};
