const path = require('path');

module.exports = ({ isPackage, projectConfig: { filenames, hot, devURl }, buildFiles }) => {
	if (isPackage) {
		return {
			path: path.resolve(process.cwd(), 'dist'),
		};
	}

	return {
		path: path.resolve(process.cwd(), 'dist'),
		publicPath: hot ? devURl : undefined,
		chunkFilename: filenames.jsChunk,
		filename: (pathData) => {
			return buildFiles[pathData.chunk.name].match(/\/blocks\//)
				? filenames.block
				: filenames.js;
		},
	};
};
