const path = require('path');

module.exports = ({
	isPackage,
	packageConfig: { packageType, main },
	projectConfig: { filenames, hot, publicPath },
	buildFiles,
}) => {
	if (isPackage) {
		// if main (output) is not a file then use as the bas epath
		const outputFolder = main.split('.').length > 1 ? 'dist' : main;

		const config = {
			path: path.resolve(process.cwd(), outputFolder),
		};

		if (typeof packageType === 'undefined' || packageType !== 'none') {
			config.libraryTarget = packageType === 'all' ? 'commonjs2' : packageType;
		}

		return config;
	}

	return {
		// when in hot reload mode we should not clear dist folder between builds
		clean: !hot,
		path: path.resolve(process.cwd(), 'dist'),
		chunkFilename: filenames.jsChunk,
		publicPath,
		filename: (pathData) => {
			if (pathData.chunk.name === 'runtime') {
				return 'fast-refresh/hmr-runtime.js';
			}
			// match windows and posix paths
			const isBlockAsset =
				buildFiles[pathData.chunk.name].match(/\/blocks?\//) ||
				buildFiles[pathData.chunk.name].match(/\\blocks?\\/);
			return isBlockAsset ? filenames.block : filenames.js;
		},
	};
};
