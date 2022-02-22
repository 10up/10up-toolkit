const path = require('path');

module.exports = ({ isPackage, projectConfig: { filenames, hot }, buildFiles }) => {
	if (isPackage) {
		return {
			path: path.resolve(process.cwd(), 'dist'),
		};
	}

	return {
		// when in hot reload mode we should not clear dist folder between builds
		clean: !hot,
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
