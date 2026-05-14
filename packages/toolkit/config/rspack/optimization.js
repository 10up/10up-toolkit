const rspack = require('@rspack/core');
const RspackImageMinimizerPlugin = require('./plugins/image-minimizer');

module.exports = ({ isProduction, projectConfig: { hot, analyze } }) => {
	return {
		concatenateModules: isProduction && !analyze,
		runtimeChunk: hot ? 'single' : false,
		minimizer: [
			new rspack.SwcJsMinimizerRspackPlugin({
				minimizerOptions: {
					compress: {
						ecma: 5,
						comparisons: false,
						inline: 2,
					},
					mangle: true,
				},
			}),
			new RspackImageMinimizerPlugin(),
		],
	};
};
