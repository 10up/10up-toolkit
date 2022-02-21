const path = require('path');

module.exports = ({ isPackage, projectConfig: { filenames }, buildFiles }) => {
	if (isPackage) {
		return {
			path: path.resolve(process.cwd(), 'dist'),
		};
	}

	return {
		path: path.resolve(process.cwd(), 'dist'),
		chunkFilename: filenames.jsChunk,
		filename: (pathData) => {
			return buildFiles[pathData.chunk.name].match(/\/blocks\//)
				? filenames.block
				: filenames.js;
		},
	};
};
