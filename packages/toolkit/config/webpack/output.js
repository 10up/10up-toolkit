const path = require('path');

module.exports = ({ isProduction, isPackage, projectConfig: { filenames }, buildFiles }) => {
	if (isPackage) {
		return {
			path: path.resolve(process.cwd(), 'dist'),
		};
	}

	return {
		clean: isProduction,
		path: path.resolve(process.cwd(), 'dist'),
		chunkFilename: filenames.jsChunk,
		filename: (pathData) => {
			if (pathData.chunk.name === 'runtime') {
				return 'fast-refresh/hmr-runtime.js';
			}
			return buildFiles[pathData.chunk.name].match(/\/blocks\//)
				? filenames.block
				: filenames.js;
		},
	};
};
